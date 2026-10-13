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
import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Query, UnprocessableEntityException, UseGuards, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsInt, IsSemVer, IsString, MaxLength, Min } from 'class-validator';
import { Model, Types } from 'mongoose';
import semver from 'semver';
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client, } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { CurrentUser } from '../common/api.js';
import { AppUpdatePolicy, AppUpdatePolicySchema, Device, DeviceSchema, Goal, GoalSchema, Job, JobSchema, Letter, LetterSchema, Session, SessionSchema, Timeline, TimelineSchema, Upload, UploadSchema, User, UserSchema, WhatIf, WhatIfSchema, } from '../database/schemas.js';
export class DeleteAccountDto {
    confirmation;
}
__decorate([
    IsString(),
    MaxLength(30),
    __metadata("design:type", String)
], DeleteAccountDto.prototype, "confirmation", void 0);
export class UpdateCheckDto {
    platform;
    version;
    build;
    appIdentifier;
}
__decorate([
    IsEnum(['android', 'ios']),
    __metadata("design:type", String)
], UpdateCheckDto.prototype, "platform", void 0);
__decorate([
    IsSemVer(),
    __metadata("design:type", String)
], UpdateCheckDto.prototype, "version", void 0);
__decorate([
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], UpdateCheckDto.prototype, "build", void 0);
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateCheckDto.prototype, "appIdentifier", void 0);
let AppUpdatesService = class AppUpdatesService {
    policies;
    config;
    constructor(policies, config) {
        this.policies = policies;
        this.config = config;
    }
    async check(dto) {
        const expected = dto.platform === 'android'
            ? this.config.get('ANDROID_PACKAGE_ID')
            : this.config.get('IOS_APP_STORE_ID');
        if (expected && dto.appIdentifier !== expected) {
            throw new UnprocessableEntityException({
                code: 'VALIDATION_ERROR',
                message: 'App identifier is not recognized',
            });
        }
        const policy = await this.policies.findOne({ platform: dto.platform, enabled: true }).lean();
        if (!policy || !this.config.get('APP_UPDATE_CHECK_ENABLED', true)) {
            return { updateAvailable: false, required: false, policy: null };
        }
        const required = semver.lt(dto.version, policy.minimumVersion) ||
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
};
AppUpdatesService = __decorate([
    Injectable(),
    __param(0, InjectModel(AppUpdatePolicy.name)),
    __metadata("design:paramtypes", [Model,
        ConfigService])
], AppUpdatesService);
export { AppUpdatesService };
let UpdateRequiredGuard = class UpdateRequiredGuard {
    updates;
    constructor(updates) {
        this.updates = updates;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (!request.header('authorization'))
            return true;
        const platform = request.header('x-app-platform');
        const version = request.header('x-app-version');
        const build = Number(request.header('x-app-build'));
        const appIdentifier = request.header('x-app-identifier');
        if (!['android', 'ios'].includes(platform ?? '') ||
            !version ||
            !Number.isInteger(build) ||
            !appIdentifier) {
            return true;
        }
        const result = await this.updates.check({
            platform: platform,
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
};
UpdateRequiredGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AppUpdatesService])
], UpdateRequiredGuard);
export { UpdateRequiredGuard };
let PrivacyService = class PrivacyService {
    config;
    users;
    sessions;
    goals;
    timeline;
    paths;
    letters;
    jobs;
    uploads;
    devices;
    s3;
    bucket;
    constructor(config, users, sessions, goals, timeline, paths, letters, jobs, uploads, devices) {
        this.config = config;
        this.users = users;
        this.sessions = sessions;
        this.goals = goals;
        this.timeline = timeline;
        this.paths = paths;
        this.letters = letters;
        this.jobs = jobs;
        this.uploads = uploads;
        this.devices = devices;
        this.bucket = config.getOrThrow('AWS_S3_BUCKET');
        this.s3 = new S3Client({
            region: config.get('AWS_REGION'),
            endpoint: config.get('S3_ENDPOINT_URL') || undefined,
            forcePathStyle: config.get('S3_FORCE_PATH_STYLE', false),
        });
    }
    async export(ownerId) {
        const id = new Types.ObjectId(ownerId);
        const [user, goals, timeline, paths, letters, uploads] = await Promise.all([
            this.users.findById(id).select('-googleSubject').lean(),
            this.goals.find({ ownerId: id }).lean(),
            this.timeline.find({ ownerId: id }).lean(),
            this.paths.find({ ownerId: id }).lean(),
            this.letters.find({ ownerId: id }).lean(),
            this.uploads.find({ ownerId: id }).select('contentType byteSize checksum purpose createdAt').lean(),
        ]);
        if (!user)
            throw new NotFoundException();
        const key = `${this.config.get('AWS_S3_PREFIX', 'development/')}exports/${ownerId}/${randomUUID()}.json`;
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
        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: 'application/json',
            ServerSideEncryption: 'AES256',
        }));
        const expiresIn = 900;
        const url = await getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn });
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
    async deleteAccount(ownerId, confirmation) {
        if (confirmation !== 'DELETE MY ACCOUNT') {
            throw new UnprocessableEntityException({
                code: 'CONFIRMATION_REQUIRED',
                message: 'Account deletion confirmation does not match',
            });
        }
        const id = new Types.ObjectId(ownerId);
        const uploads = await this.uploads.find({ ownerId: id }).lean();
        if (uploads.length) {
            await this.s3.send(new DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: { Objects: uploads.map((upload) => ({ Key: upload.objectKey })) },
            }));
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
            backupNotice: 'Encrypted backups may retain data until their configured retention period ends.',
        };
    }
};
PrivacyService = __decorate([
    Injectable(),
    __param(1, InjectModel(User.name)),
    __param(2, InjectModel(Session.name)),
    __param(3, InjectModel(Goal.name)),
    __param(4, InjectModel(Timeline.name)),
    __param(5, InjectModel(WhatIf.name)),
    __param(6, InjectModel(Letter.name)),
    __param(7, InjectModel(Job.name)),
    __param(8, InjectModel(Upload.name)),
    __param(9, InjectModel(Device.name)),
    __metadata("design:paramtypes", [ConfigService,
        Model,
        Model,
        Model,
        Model,
        Model,
        Model,
        Model,
        Model,
        Model])
], PrivacyService);
export { PrivacyService };
let PrivacyController = class PrivacyController {
    privacy;
    constructor(privacy) {
        this.privacy = privacy;
    }
    export(u) { return this.privacy.export(u.id); }
    remove(u, dto) {
        return this.privacy.deleteAccount(u.id, dto.confirmation);
    }
};
__decorate([
    Get('export'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PrivacyController.prototype, "export", null);
__decorate([
    Delete('account'),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, DeleteAccountDto]),
    __metadata("design:returntype", void 0)
], PrivacyController.prototype, "remove", null);
PrivacyController = __decorate([
    ApiTags('privacy'),
    ApiBearerAuth(),
    UseGuards(AuthGuard('jwt')),
    Controller('privacy'),
    __metadata("design:paramtypes", [PrivacyService])
], PrivacyController);
export { PrivacyController };
let AppUpdatesController = class AppUpdatesController {
    updates;
    constructor(updates) {
        this.updates = updates;
    }
    check(dto) { return this.updates.check(dto); }
};
__decorate([
    Get('check'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateCheckDto]),
    __metadata("design:returntype", void 0)
], AppUpdatesController.prototype, "check", null);
AppUpdatesController = __decorate([
    ApiTags('app-updates'),
    Controller('app-updates'),
    __metadata("design:paramtypes", [AppUpdatesService])
], AppUpdatesController);
export { AppUpdatesController };
let PrivacyModule = class PrivacyModule {
};
PrivacyModule = __decorate([
    Module({
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
], PrivacyModule);
export { PrivacyModule };
//# sourceMappingURL=privacy.module.js.map