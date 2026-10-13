import {
  Body,
  Controller,
  HttpCode,
  Injectable,
  Module,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { OAuth2Client } from 'google-auth-library';
import { Model, Types } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { randomUUID, createHmac } from 'node:crypto';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, type AuthUser } from '../common/api.js';
import {
  Session,
  SessionSchema,
  User,
  UserSchema,
  type Doc,
} from '../database/schemas.js';

export class GoogleSignInDto {
  @ApiProperty({ description: 'Google ID token' })
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  idToken: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  refreshToken: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: { sub: string; email: string; sid: string }): AuthUser {
    if (!payload.sub || !payload.sid) throw new UnauthorizedException();
    return { id: payload.sub, email: payload.email, sessionId: payload.sid };
  }
}

@Injectable()
export class AuthService {
  private readonly google = new OAuth2Client();

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Session.name) private readonly sessions: Model<Session>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private tokenHash(token: string): string {
    return createHmac(
      'sha256',
      this.config.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
    )
      .update(token)
      .digest('hex');
  }

  private async issue(
    user: Doc<User>,
    request: Request,
    familyId: string = randomUUID(),
  ) {
    const sessionId = new Types.ObjectId();
    const claims = {
      sub: user._id.toString(),
      email: user.email,
      sid: sessionId.toString(),
      family: familyId,
    };
    const accessToken = await this.jwt.signAsync(claims, {
      secret: this.config.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.config.get<string>('ACCESS_TOKEN_TTL', '15m') as never,
    });
    const refreshToken = await this.jwt.signAsync(claims, {
      secret: this.config.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.config.get<string>('REFRESH_TOKEN_TTL', '30d') as never,
    });
    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.sessions.create({
      _id: sessionId,
      ownerId: user._id,
      familyId,
      tokenHash: this.tokenHash(refreshToken),
      expiresAt: new Date(decoded.exp * 1000),
      userAgent: request.header('user-agent')?.slice(0, 300),
    });
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.config.get<string>('ACCESS_TOKEN_TTL', '15m'),
    };
  }

  async googleSignIn(dto: GoogleSignInDto, request: Request) {
    const audiences = this.config
      .getOrThrow<string>('GOOGLE_ALLOWED_AUDIENCES')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const ticket = await this.google.verifyIdToken({
      idToken: dto.idToken,
      audience: audiences,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException({
        code: 'INVALID_GOOGLE_TOKEN',
        message: 'Google identity could not be verified',
      });
    }
    const user = await this.users.findOneAndUpdate(
      { googleSubject: payload.sub },
      {
        $set: {
          email: payload.email,
          emailVerified: true,
          displayName: (payload.name ?? 'Lifeloom user').slice(0, 80),
        },
        $setOnInsert: {
          googleSubject: payload.sub,
          timeZone: 'UTC',
          accountState: 'active',
        },
      },
      { upsert: true, new: true },
    );
    return {
      user: this.publicUser(user),
      ...(await this.issue(user, request)),
    };
  }

  async refresh(dto: RefreshDto, request: Request) {
    let claims: { sub: string; sid: string; family: string };
    try {
      claims = await this.jwt.verifyAsync(dto.refreshToken, {
        secret: this.config.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Session is invalid or expired',
      });
    }
    const session = await this.sessions.findById(claims.sid);
    if (
      !session ||
      session.revokedAt ||
      session.tokenHash !== this.tokenHash(dto.refreshToken)
    ) {
      await this.sessions.updateMany(
        { familyId: claims.family },
        { $set: { revokedAt: new Date() } },
      );
      throw new UnauthorizedException({
        code: 'REFRESH_REPLAY_DETECTED',
        message: 'Session has been revoked',
      });
    }
    const revoked = await this.sessions.findOneAndUpdate(
      { _id: session._id, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
      { new: true },
    );
    if (!revoked) throw new UnauthorizedException();
    const user = await this.users.findById(claims.sub);
    if (!user || user.accountState !== 'active')
      throw new UnauthorizedException();
    const tokens = await this.issue(user, request, session.familyId);
    const next = this.jwt.decode(tokens.refreshToken) as { sid: string };
    session.replacedBy = new Types.ObjectId(next.sid);
    await session.save();
    return tokens;
  }

  async logout(user: AuthUser) {
    await this.sessions.updateOne(
      { _id: user.sessionId, ownerId: user.id },
      { $set: { revokedAt: new Date() } },
    );
    return { loggedOut: true };
  }

  publicUser(user: Doc<User>) {
    return {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      birthDate: user.birthDate,
      expectedLifespanYears: user.expectedLifespanYears,
      timeZone: user.timeZone,
      locale: user.locale,
    };
  }
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('google')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Exchange a verified Google ID token for Lifeloom tokens',
  })
  signIn(@Body() dto: GoogleSignInDto, @Req() req: Request) {
    return this.auth.googleSignIn(dto, req);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate a refresh token' })
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto, req);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  logout(@CurrentUser() user: AuthUser) {
    return this.auth.logout(user);
  }
}

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
