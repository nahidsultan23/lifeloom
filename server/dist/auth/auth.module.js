var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, HttpCode, Injectable, Module, Post, Req, UnauthorizedException, UseGuards, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { OAuth2Client } from 'google-auth-library';
import { Model, Types } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { randomUUID, createHmac } from 'node:crypto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/api.js';
import { Session, SessionSchema, User, UserSchema, } from '../database/schemas.js';
export class GoogleSignInDto {
    idToken;
}
__decorate([
    ApiProperty({ description: 'Google ID token' }),
    IsString(),
    MinLength(20),
    MaxLength(5000),
    __metadata("design:type", String)
], GoogleSignInDto.prototype, "idToken", void 0);
export class RefreshDto {
    refreshToken;
}
__decorate([
    ApiProperty(),
    IsString(),
    MinLength(20),
    MaxLength(5000),
    __metadata("design:type", String)
], RefreshDto.prototype, "refreshToken", void 0);
let JwtStrategy = class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.getOrThrow('ACCESS_TOKEN_SECRET'),
            ignoreExpiration: false,
        });
    }
    validate(payload) {
        if (!payload.sub || !payload.sid)
            throw new UnauthorizedException();
        return { id: payload.sub, email: payload.email, sessionId: payload.sid };
    }
};
JwtStrategy = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], JwtStrategy);
export { JwtStrategy };
let AuthService = class AuthService {
    users;
    sessions;
    jwt;
    config;
    google = new OAuth2Client();
    constructor(users, sessions, jwt, config) {
        this.users = users;
        this.sessions = sessions;
        this.jwt = jwt;
        this.config = config;
    }
    tokenHash(token) {
        return createHmac('sha256', this.config.getOrThrow('REFRESH_TOKEN_SECRET'))
            .update(token)
            .digest('hex');
    }
    async issue(user, request, familyId = randomUUID()) {
        const sessionId = new Types.ObjectId();
        const claims = {
            sub: user._id.toString(),
            email: user.email,
            sid: sessionId.toString(),
            family: familyId,
        };
        const accessToken = await this.jwt.signAsync(claims, {
            secret: this.config.getOrThrow('ACCESS_TOKEN_SECRET'),
            expiresIn: this.config.get('ACCESS_TOKEN_TTL', '15m'),
        });
        const refreshToken = await this.jwt.signAsync(claims, {
            secret: this.config.getOrThrow('REFRESH_TOKEN_SECRET'),
            expiresIn: this.config.get('REFRESH_TOKEN_TTL', '30d'),
        });
        const decoded = this.jwt.decode(refreshToken);
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
            accessTokenExpiresIn: this.config.get('ACCESS_TOKEN_TTL', '15m'),
        };
    }
    async googleSignIn(dto, request) {
        const audiences = this.config
            .getOrThrow('GOOGLE_ALLOWED_AUDIENCES')
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
        const user = await this.users.findOneAndUpdate({ googleSubject: payload.sub }, {
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
        }, { upsert: true, new: true });
        return { user: this.publicUser(user), ...(await this.issue(user, request)) };
    }
    async refresh(dto, request) {
        let claims;
        try {
            claims = await this.jwt.verifyAsync(dto.refreshToken, {
                secret: this.config.getOrThrow('REFRESH_TOKEN_SECRET'),
            });
        }
        catch {
            throw new UnauthorizedException({
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Session is invalid or expired',
            });
        }
        const session = await this.sessions.findById(claims.sid);
        if (!session ||
            session.revokedAt ||
            session.tokenHash !== this.tokenHash(dto.refreshToken)) {
            await this.sessions.updateMany({ familyId: claims.family }, { $set: { revokedAt: new Date() } });
            throw new UnauthorizedException({
                code: 'REFRESH_REPLAY_DETECTED',
                message: 'Session has been revoked',
            });
        }
        const revoked = await this.sessions.findOneAndUpdate({ _id: session._id, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } }, { new: true });
        if (!revoked)
            throw new UnauthorizedException();
        const user = await this.users.findById(claims.sub);
        if (!user || user.accountState !== 'active')
            throw new UnauthorizedException();
        const tokens = await this.issue(user, request, session.familyId);
        const next = this.jwt.decode(tokens.refreshToken);
        session.replacedBy = new Types.ObjectId(next.sid);
        await session.save();
        return tokens;
    }
    async logout(user) {
        await this.sessions.updateOne({ _id: user.sessionId, ownerId: user.id }, { $set: { revokedAt: new Date() } });
        return { loggedOut: true };
    }
    publicUser(user) {
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
};
AuthService = __decorate([
    Injectable(),
    __param(0, InjectModel(User.name)),
    __param(1, InjectModel(Session.name)),
    __metadata("design:paramtypes", [Model,
        Model,
        JwtService,
        ConfigService])
], AuthService);
export { AuthService };
let AuthController = class AuthController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    signIn(dto, req) {
        return this.auth.googleSignIn(dto, req);
    }
    refresh(dto, req) {
        return this.auth.refresh(dto, req);
    }
    logout(user) {
        return this.auth.logout(user);
    }
};
__decorate([
    Post('google'),
    HttpCode(200),
    ApiOperation({ summary: 'Exchange a verified Google ID token for Lifeloom tokens' }),
    __param(0, Body()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GoogleSignInDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signIn", null);
__decorate([
    Post('refresh'),
    HttpCode(200),
    ApiOperation({ summary: 'Rotate a refresh token' }),
    __param(0, Body()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RefreshDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    Post('logout'),
    HttpCode(200),
    UseGuards(AuthGuard('jwt')),
    ApiBearerAuth(),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
AuthController = __decorate([
    ApiTags('auth'),
    Controller('auth'),
    __metadata("design:paramtypes", [AuthService])
], AuthController);
export { AuthController };
let AuthModule = class AuthModule {
};
AuthModule = __decorate([
    Module({
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
], AuthModule);
export { AuthModule };
//# sourceMappingURL=auth.module.js.map