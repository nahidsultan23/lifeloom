import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Patch,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IANAZone } from 'luxon';
import { Model } from 'mongoose';
import { CurrentUser, type AuthUser } from '../common/api.js';
import { User, UserSchema } from '../database/schemas.js';

export class UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @ApiPropertyOptional({ example: '1994-06-21' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 150, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(150)
  expectedLifespanYears?: number | null;

  @ApiPropertyOptional({ example: 'Asia/Dhaka' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  notificationPreferences?: Record<string, unknown>;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  async get(ownerId: string) {
    const user = await this.users
      .findOne({ _id: ownerId, accountState: 'active' })
      .lean();
    if (!user) return null;
    const { googleSubject: _subject, ...safe } = user;
    return safe;
  }

  async update(ownerId: string, dto: UpdateProfileDto) {
    if (dto.timeZone && !IANAZone.isValidZone(dto.timeZone)) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Timezone must be a valid IANA zone',
      });
    }
    const update: Record<string, unknown> = { ...dto };
    if (dto.expectedLifespanYears === null) {
      delete update.expectedLifespanYears;
      return this.users
        .findOneAndUpdate(
          { _id: ownerId, accountState: 'active' },
          { $set: update, $unset: { expectedLifespanYears: 1 } },
          { new: true },
        )
        .lean();
    }
    return this.users
      .findOneAndUpdate(
        { _id: ownerId, accountState: 'active' },
        { $set: update },
        { new: true },
      )
      .select('-googleSubject')
      .lean();
  }
}

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('profile')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.users.get(user.id);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.update(user.id, dto);
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
