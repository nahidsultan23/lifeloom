import {
  Body,
  CanActivate,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Query,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsSemVer,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Model, Types } from 'mongoose';
import semver from 'semver';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { CurrentUser, type AuthUser } from '../common/api.js';
import {
  AppUpdatePolicy,
  AppUpdatePolicySchema,
  Device,
  DeviceSchema,
  Goal,
  GoalSchema,
  Job,
  JobSchema,
  Letter,
  LetterSchema,
  Session,
  SessionSchema,
  Timeline,
  TimelineSchema,
  Upload,
  UploadSchema,
  User,
  UserSchema,
  WhatIf,
  WhatIfSchema,
} from '../database/schemas.js';

export class DeleteAccountDto {
  @IsString()
  @MaxLength(30)
  confirmation: string;
}

export class UpdateCheckDto {
  @IsEnum(['android', 'ios']) platform: 'android' | 'ios';
  @IsSemVer() version: string;
  @IsInt() @Min(1) build: number;
  @IsString() @MaxLength(200) appIdentifier: string;
}

@Injectable()
export class AppUpdatesService {
  constructor(
    @InjectModel(AppUpdatePolicy.name)
    private readonly policies: Model<AppUpdatePolicy>,
    private readonly config: ConfigService,
  ) {}

  async check(dto: UpdateCheckDto) {
    const expected =
      dto.platform === 'android'
        ? this.config.get<string>('ANDROID_PACKAGE_ID')
        : this.config.get<string>('IOS_APP_STORE_ID');
    if (expected && dto.appIdentifier !== expected) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'App identifier is not recognized',
      });
    }
    const policy = await this.policies
      .findOne({ platform: dto.platform, enabled: true })
      .lean();
    if (
      !policy ||
      !this.config.get<boolean>('APP_UPDATE_CHECK_ENABLED', true)
    ) {
      return { updateAvailable: false, required: false, policy: null };
    }
    const required =
      semver.lt(dto.version, policy.minimumVersion) ||
      (dto.version === policy.minimumVersion &&
        policy.minimumBuild !== undefined &&
        dto.build < policy.minimumBuild);
    return {
      updateAvailable: semver.lt(dto.version, policy.latestVersion),
      required,
      policy: {
        latestVersion: policy.latestVersion,
        minimumVersion: policy.minimumVersion,
        minimumBuild: policy.minimumBuild,
        storeUrl: policy.storeUrl,
        releaseNotes: policy.releaseNotes,
        policyVersion: policy.policyVersion,
      },
    };
  }
}

@Injectable()
export class UpdateRequiredGuard implements CanActivate {
  constructor(private readonly updates: AppUpdatesService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.header('authorization')) return true;
    const platform = request.header('x-app-platform');
    const version = request.header('x-app-version');
    const build = Number(request.header('x-app-build'));
    const appIdentifier = request.header('x-app-identifier');
    if (
      !['android', 'ios'].includes(platform ?? '') ||
      !version ||
      !Number.isInteger(build) ||
      !appIdentifier
    ) {
      return true;
    }
    const result = await this.updates.check({
      platform: platform as 'android' | 'ios',
      version,
      build,
      appIdentifier,
    });
    if (result.required) {
      throw new UnprocessableEntityException({
        code: 'APP_UPDATE_REQUIRED',
        message: 'A required app update is available',
      });
    }
    return true;
  }
}

@Injectable()
export class PrivacyService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Session.name) private readonly sessions: Model<Session>,
    @InjectModel(Goal.name) private readonly goals: Model<Goal>,
    @InjectModel(Timeline.name) private readonly timeline: Model<Timeline>,
    @InjectModel(WhatIf.name) private readonly paths: Model<WhatIf>,
    @InjectModel(Letter.name) private readonly letters: Model<Letter>,
    @InjectModel(Job.name) private readonly jobs: Model<Job>,
    @InjectModel(Upload.name) private readonly uploads: Model<Upload>,
    @InjectModel(Device.name) private readonly devices: Model<Device>,
  ) {
    this.bucket = config.getOrThrow<string>('AWS_S3_BUCKET');
    this.s3 = new S3Client({
      region: config.get<string>('AWS_REGION'),
      endpoint: config.get<string>('S3_ENDPOINT_URL') || undefined,
      forcePathStyle: config.get<boolean>('S3_FORCE_PATH_STYLE', false),
    });
  }

  async export(ownerId: string) {
    const id = new Types.ObjectId(ownerId);
    const [user, goals, timeline, paths, letters, uploads] = await Promise.all([
      this.users.findById(id).select('-googleSubject').lean(),
      this.goals.find({ ownerId: id }).lean(),
      this.timeline.find({ ownerId: id }).lean(),
      this.paths.find({ ownerId: id }).lean(),
      this.letters.find({ ownerId: id }).lean(),
      this.uploads
        .find({ ownerId: id })
        .select('contentType byteSize checksum purpose createdAt')
        .lean(),
    ]);
    if (!user) throw new NotFoundException();
    const key = `${this.config.get<string>('AWS_S3_PREFIX', 'development/')}exports/${ownerId}/${randomUUID()}.json`;
    const body = JSON.stringify({
      exportedAt: new Date().toISOString(),
      formatVersion: 1,
      user,
      goals,
      timeline,
      whatIfPaths: paths,
      letters,
      attachmentMetadata: uploads,
    });
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256',
      }),
    );
    const expiresIn = 900;
    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
    await this.jobs.create({
      ownerId: id,
      type: 'export',
      resourceId: id,
      idempotencyKey: `export-cleanup:${key}`,
      runAt: new Date(Date.now() + expiresIn * 1000),
      result: { objectKey: key },
    });
    return { url, expiresIn, format: 'json', includesFileMetadata: true };
  }

  async deleteAccount(ownerId: string, confirmation: string) {
    if (confirmation !== 'DELETE MY ACCOUNT') {
      throw new UnprocessableEntityException({
        code: 'CONFIRMATION_REQUIRED',
        message: 'Account deletion confirmation does not match',
      });
    }
    const id = new Types.ObjectId(ownerId);
    const uploads = await this.uploads.find({ ownerId: id }).lean();
    if (uploads.length) {
      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: uploads.map((upload) => ({ Key: upload.objectKey })),
          },
        }),
      );
    }
    await Promise.all([
      this.sessions.deleteMany({ ownerId: id }),
      this.goals.deleteMany({ ownerId: id }),
      this.timeline.deleteMany({ ownerId: id }),
      this.paths.deleteMany({ ownerId: id }),
      this.letters.deleteMany({ ownerId: id }),
      this.jobs.deleteMany({ ownerId: id }),
      this.uploads.deleteMany({ ownerId: id }),
      this.devices.deleteMany({ ownerId: id }),
    ]);
    await this.users.deleteOne({ _id: id });
    return {
      deleted: true,
      backupNotice:
        'Encrypted backups may retain data until their configured retention period ends.',
    };
  }
}

@ApiTags('privacy')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}
  @Get('export') export(@CurrentUser() u: AuthUser) {
    return this.privacy.export(u.id);
  }
  @Delete('account') remove(
    @CurrentUser() u: AuthUser,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.privacy.deleteAccount(u.id, dto.confirmation);
  }
}

@ApiTags('app-updates')
@Controller('app-updates')
export class AppUpdatesController {
  constructor(private readonly updates: AppUpdatesService) {}
  @Get('check')
  check(@Query() dto: UpdateCheckDto) {
    return this.updates.check(dto);
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppUpdatePolicy.name, schema: AppUpdatePolicySchema },
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Goal.name, schema: GoalSchema },
      { name: Timeline.name, schema: TimelineSchema },
      { name: WhatIf.name, schema: WhatIfSchema },
      { name: Letter.name, schema: LetterSchema },
      { name: Job.name, schema: JobSchema },
      { name: Upload.name, schema: UploadSchema },
      { name: Device.name, schema: DeviceSchema },
    ]),
  ],
  controllers: [PrivacyController, AppUpdatesController],
  providers: [
    PrivacyService,
    AppUpdatesService,
    { provide: APP_GUARD, useClass: UpdateRequiredGuard },
  ],
  exports: [AppUpdatesService],
})
export class PrivacyModule {}
