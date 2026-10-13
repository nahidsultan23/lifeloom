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
import { BadRequestException, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client, } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fileTypeFromBuffer } from 'file-type';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { Model, Types } from 'mongoose';
import { CurrentUser } from '../common/api.js';
import { Goal, GoalSchema, Letter, LetterSchema, Timeline, TimelineSchema, Upload, UploadSchema, User, UserSchema, WhatIf, WhatIfSchema, } from '../database/schemas.js';
const PURPOSES = ['avatar', 'letter', 'memory', 'what-if'];
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/mp4', 'audio/webm']);
const CAPS = {
    avatar: { photos: 1, audio: 0 },
    letter: { photos: 5, audio: 3 },
    memory: { photos: 5, audio: 3 },
    'what-if': { photos: 3, audio: 0 },
};
let UploadsService = class UploadsService {
    config;
    uploads;
    users;
    letters;
    timeline;
    paths;
    goals;
    s3;
    bucket;
    constructor(config, uploads, users, letters, timeline, paths, goals) {
        this.config = config;
        this.uploads = uploads;
        this.users = users;
        this.letters = letters;
        this.timeline = timeline;
        this.paths = paths;
        this.goals = goals;
        this.bucket = config.getOrThrow('AWS_S3_BUCKET');
        this.s3 = new S3Client({
            region: config.get('AWS_REGION'),
            endpoint: config.get('S3_ENDPOINT_URL') || undefined,
            forcePathStyle: config.get('S3_FORCE_PATH_STYLE', false),
        });
    }
    async frameImage(buffer, purpose) {
        const ratio = purpose === 'avatar' ? { width: 1024, height: 1024 } : { width: 1440, height: 1080 };
        return sharp(buffer)
            .rotate()
            .resize({
            ...ratio,
            fit: 'contain',
            background: '#F6F1E7',
            withoutEnlargement: false,
        })
            .webp({ quality: 80 })
            .toBuffer();
    }
    async create(ownerId, purposeRaw, file) {
        if (!PURPOSES.includes(purposeRaw)) {
            throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Upload purpose is invalid' });
        }
        if (!file)
            throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'File is required' });
        const purpose = purposeRaw;
        const detected = await fileTypeFromBuffer(file.buffer);
        if (!detected || (!IMAGE_TYPES.has(detected.mime) && !AUDIO_TYPES.has(detected.mime))) {
            throw new BadRequestException({ code: 'UNSUPPORTED_FILE_TYPE', message: 'File type is not supported' });
        }
        const isImage = IMAGE_TYPES.has(detected.mime);
        if (!isImage && file.size > 15 * 1024 * 1024) {
            throw new BadRequestException({ code: 'FILE_TOO_LARGE', message: 'Audio must not exceed 15 MB' });
        }
        if (isImage && CAPS[purpose].photos === 0)
            throw new BadRequestException();
        if (!isImage && CAPS[purpose].audio === 0) {
            throw new BadRequestException({ code: 'UNSUPPORTED_ATTACHMENT', message: 'Audio is not allowed here' });
        }
        const body = isImage ? await this.frameImage(file.buffer, purpose) : file.buffer;
        const contentType = isImage ? 'image/webp' : detected.mime;
        const extension = isImage ? 'webp' : detected.ext;
        const prefix = this.config.get('AWS_S3_PREFIX', 'development/');
        const objectKey = `${prefix}${ownerId}/${purpose}/${randomUUID()}.${extension}`;
        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            Body: body,
            ContentType: contentType,
            ServerSideEncryption: 'AES256',
        }));
        try {
            return await this.uploads.create({
                ownerId,
                objectKey,
                contentType,
                byteSize: body.length,
                checksum: createHash('sha256').update(body).digest('hex'),
                purpose,
                temporary: true,
                expiresAt: new Date(Date.now() + this.config.get('UPLOAD_TEMP_TTL_HOURS', 24) * 3600000),
            });
        }
        catch (error) {
            await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
            throw error;
        }
    }
    async access(ownerId, id) {
        const upload = await this.uploads.findOne({ _id: id, ownerId });
        if (!upload)
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Upload not found' });
        const expiresIn = this.config.get('S3_PRESIGNED_URL_TTL_SECONDS', 300);
        const url = await getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: upload.objectKey }), { expiresIn });
        return { url, expiresIn };
    }
    async attach(ownerId, uploadId, parentType, parentId) {
        const upload = await this.uploads.findOne({ _id: uploadId, ownerId, temporary: true });
        if (!upload || upload.purpose !== parentType) {
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Upload not found' });
        }
        let parent = null;
        if (parentType === 'avatar') {
            await this.users.updateOne({ _id: ownerId }, { $set: { avatarUploadId: upload._id } });
        }
        else if (parentType === 'letter') {
            parent = await this.letters.findOne({ _id: parentId, ownerId });
        }
        else if (parentType === 'memory') {
            parent = await this.timeline.findOne({ _id: parentId, ownerId, eventType: 'memory' });
        }
        else {
            parent = await this.paths.findOne({ _id: parentId, ownerId });
        }
        if (parentType !== 'avatar' && !parent) {
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Parent record not found' });
        }
        if (parent) {
            const existing = parent.attachmentIds ?? [];
            const uploads = await this.uploads.find({ _id: { $in: [...existing, upload._id] }, ownerId }).lean();
            const photos = uploads.filter((item) => IMAGE_TYPES.has(item.contentType)).length;
            const audio = uploads.length - photos;
            if (photos > CAPS[parentType].photos || audio > CAPS[parentType].audio) {
                throw new BadRequestException({ code: 'ATTACHMENT_LIMIT_EXCEEDED', message: 'Attachment limit exceeded' });
            }
            if (parentType === 'letter') {
                await this.letters.updateOne({ _id: parentId, ownerId }, { $addToSet: { attachmentIds: upload._id } });
            }
            else if (parentType === 'memory') {
                await this.timeline.updateOne({ _id: parentId, ownerId }, { $addToSet: { attachmentIds: upload._id } });
            }
            else {
                await this.paths.updateOne({ _id: parentId, ownerId }, { $addToSet: { attachmentIds: upload._id } });
            }
        }
        upload.temporary = false;
        upload.parentType = parentType;
        upload.parentId = parentType === 'avatar' ? new Types.ObjectId(ownerId) : new Types.ObjectId(parentId);
        upload.expiresAt = new Date('9999-12-31T23:59:59.999Z');
        return upload.save();
    }
    async remove(ownerId, id) {
        const upload = await this.uploads.findOneAndDelete({ _id: id, ownerId });
        if (!upload)
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Upload not found' });
        await Promise.all([
            this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: upload.objectKey })),
            this.users.updateOne({ _id: ownerId, avatarUploadId: upload._id }, { $unset: { avatarUploadId: 1 } }),
            this.letters.updateMany({ ownerId }, { $pull: { attachmentIds: upload._id } }),
            this.timeline.updateMany({ ownerId }, { $pull: { attachmentIds: upload._id } }),
            this.paths.updateMany({ ownerId }, { $pull: { attachmentIds: upload._id } }),
        ]);
        return { deleted: true };
    }
    async purgeExpired() {
        const expired = await this.uploads.find({ temporary: true, expiresAt: { $lte: new Date() } }).limit(100);
        await Promise.all(expired.map((upload) => this.remove(upload.ownerId.toString(), upload._id.toString())));
        return expired.length;
    }
};
UploadsService = __decorate([
    Injectable(),
    __param(1, InjectModel(Upload.name)),
    __param(2, InjectModel(User.name)),
    __param(3, InjectModel(Letter.name)),
    __param(4, InjectModel(Timeline.name)),
    __param(5, InjectModel(WhatIf.name)),
    __param(6, InjectModel(Goal.name)),
    __metadata("design:paramtypes", [ConfigService,
        Model,
        Model,
        Model,
        Model,
        Model,
        Model])
], UploadsService);
export { UploadsService };
let UploadsController = class UploadsController {
    uploads;
    constructor(uploads) {
        this.uploads = uploads;
    }
    create(u, purpose, file) {
        return this.uploads.create(u.id, purpose, file);
    }
    access(u, id) { return this.uploads.access(u.id, id); }
    attach(u, id, type, parentId) {
        return this.uploads.attach(u.id, id, type, parentId);
    }
    remove(u, id) { return this.uploads.remove(u.id, id); }
};
__decorate([
    Post(),
    ApiConsumes('multipart/form-data'),
    ApiQuery({ name: 'purpose', enum: PURPOSES }),
    UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024, files: 1 } })),
    __param(0, CurrentUser()),
    __param(1, Query('purpose')),
    __param(2, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "create", null);
__decorate([
    Get(':id/access'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "access", null);
__decorate([
    Post(':id/attach/:parentType/:parentId'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __param(2, Param('parentType')),
    __param(3, Param('parentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "attach", null);
__decorate([
    Delete(':id'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "remove", null);
UploadsController = __decorate([
    ApiTags('uploads'),
    ApiBearerAuth(),
    UseGuards(AuthGuard('jwt')),
    Controller('uploads'),
    __metadata("design:paramtypes", [UploadsService])
], UploadsController);
export { UploadsController };
let UploadsModule = class UploadsModule {
};
UploadsModule = __decorate([
    Module({
        imports: [
            MongooseModule.forFeature([
                { name: Upload.name, schema: UploadSchema },
                { name: User.name, schema: UserSchema },
                { name: Letter.name, schema: LetterSchema },
                { name: Timeline.name, schema: TimelineSchema },
                { name: WhatIf.name, schema: WhatIfSchema },
                { name: Goal.name, schema: GoalSchema },
            ]),
        ],
        providers: [UploadsService],
        controllers: [UploadsController],
        exports: [UploadsService],
    })
], UploadsModule);
export { UploadsModule };
//# sourceMappingURL=uploads.module.js.map