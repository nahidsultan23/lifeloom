import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fileTypeFromBuffer } from 'file-type';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { Model, Types } from 'mongoose';
import { CurrentUser, type AuthUser } from '../common/api.js';
import {
  Goal,
  GoalSchema,
  Letter,
  LetterSchema,
  Timeline,
  TimelineSchema,
  Upload,
  UploadSchema,
  User,
  UserSchema,
  WhatIf,
  WhatIfSchema,
} from '../database/schemas.js';

const PURPOSES = ['avatar', 'letter', 'memory', 'what-if'] as const;
export type Purpose = (typeof PURPOSES)[number];
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/mp4', 'audio/webm']);
const CAPS: Record<Purpose, { photos: number; audio: number }> = {
  avatar: { photos: 1, audio: 0 },
  letter: { photos: 5, audio: 3 },
  memory: { photos: 5, audio: 3 },
  'what-if': { photos: 3, audio: 0 },
};

export function frameImage(buffer: Buffer, purpose: Purpose): Promise<Buffer> {
  const ratio =
    purpose === 'avatar'
      ? { width: 1024, height: 1024 }
      : { width: 1440, height: 1080 };
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

@Injectable()
export class UploadsService implements OnModuleInit, OnModuleDestroy {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Upload.name) private readonly uploads: Model<Upload>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Letter.name) private readonly letters: Model<Letter>,
    @InjectModel(Timeline.name) private readonly timeline: Model<Timeline>,
    @InjectModel(WhatIf.name) private readonly paths: Model<WhatIf>,
    @InjectModel(Goal.name) private readonly goals: Model<Goal>,
  ) {
    this.bucket = config.getOrThrow<string>('AWS_S3_BUCKET');
    this.s3 = new S3Client({
      region: config.get<string>('AWS_REGION'),
      endpoint: config.get<string>('S3_ENDPOINT_URL') || undefined,
      forcePathStyle: config.get<boolean>('S3_FORCE_PATH_STYLE', false),
    });
  }

  onModuleInit() {
    if (this.config.get<boolean>('BACKGROUND_JOBS_ENABLED', false)) {
      this.cleanupTimer = setInterval(
        () => void this.purgeExpired().catch(() => undefined),
        60 * 60 * 1000,
      );
      this.cleanupTimer.unref();
      void this.purgeExpired().catch(() => undefined);
    }
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  private async frameImage(buffer: Buffer, purpose: Purpose): Promise<Buffer> {
    return frameImage(buffer, purpose);
  }

  async create(
    ownerId: string,
    purposeRaw: string,
    file?: Express.Multer.File,
  ) {
    if (!PURPOSES.includes(purposeRaw as Purpose)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Upload purpose is invalid',
      });
    }
    if (!file)
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'File is required',
      });
    const purpose = purposeRaw as Purpose;
    const detected = await fileTypeFromBuffer(file.buffer);
    if (
      !detected ||
      (!IMAGE_TYPES.has(detected.mime) && !AUDIO_TYPES.has(detected.mime))
    ) {
      throw new BadRequestException({
        code: 'UNSUPPORTED_FILE_TYPE',
        message: 'File type is not supported',
      });
    }
    const isImage = IMAGE_TYPES.has(detected.mime);
    if (!isImage && file.size > 15 * 1024 * 1024) {
      throw new BadRequestException({
        code: 'FILE_TOO_LARGE',
        message: 'Audio must not exceed 15 MB',
      });
    }
    if (isImage && CAPS[purpose].photos === 0) throw new BadRequestException();
    if (!isImage && CAPS[purpose].audio === 0) {
      throw new BadRequestException({
        code: 'UNSUPPORTED_ATTACHMENT',
        message: 'Audio is not allowed here',
      });
    }
    const body = isImage
      ? await this.frameImage(file.buffer, purpose)
      : file.buffer;
    const contentType = isImage ? 'image/webp' : detected.mime;
    const extension = isImage ? 'webp' : detected.ext;
    const prefix = this.config.get<string>('AWS_S3_PREFIX', 'development/');
    const objectKey = `${prefix}${ownerId}/${purpose}/${randomUUID()}.${extension}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      }),
    );
    try {
      return await this.uploads.create({
        ownerId,
        objectKey,
        contentType,
        byteSize: body.length,
        checksum: createHash('sha256').update(body).digest('hex'),
        purpose,
        temporary: true,
        expiresAt: new Date(
          Date.now() +
            this.config.get<number>('UPLOAD_TEMP_TTL_HOURS', 24) * 3600000,
        ),
      });
    } catch (error) {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      );
      throw error;
    }
  }

  async access(ownerId: string, id: string) {
    const upload = await this.uploads.findOne({ _id: id, ownerId });
    if (!upload)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Upload not found',
      });
    const expiresIn = this.config.get<number>(
      'S3_PRESIGNED_URL_TTL_SECONDS',
      300,
    );
    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: upload.objectKey }),
      { expiresIn },
    );
    return { url, expiresIn };
  }

  async attach(
    ownerId: string,
    uploadId: string,
    parentType: Purpose,
    parentId: string,
  ) {
    const upload = await this.uploads.findOne({
      _id: uploadId,
      ownerId,
      temporary: true,
    });
    if (!upload || upload.purpose !== parentType) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Upload not found',
      });
    }
    let parent: { attachmentIds?: Types.ObjectId[] } | null = null;
    let replacedAvatarId: Types.ObjectId | undefined;
    if (parentType === 'avatar') {
      const user = await this.users.findOne({ _id: ownerId }).lean();
      replacedAvatarId = user?.avatarUploadId;
      await this.users.updateOne(
        { _id: ownerId },
        { $set: { avatarUploadId: upload._id } },
      );
    } else if (parentType === 'letter') {
      parent = await this.letters.findOne({ _id: parentId, ownerId });
    } else if (parentType === 'memory') {
      parent = await this.timeline.findOne({
        _id: parentId,
        ownerId,
        eventType: 'memory',
      });
    } else {
      parent = await this.paths.findOne({ _id: parentId, ownerId });
    }
    if (parentType !== 'avatar' && !parent) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Parent record not found',
      });
    }
    if (parent) {
      const existing = parent.attachmentIds ?? [];
      const uploads = await this.uploads
        .find({ _id: { $in: [...existing, upload._id] }, ownerId })
        .lean();
      const photos = uploads.filter((item) =>
        IMAGE_TYPES.has(item.contentType),
      ).length;
      const audio = uploads.length - photos;
      if (photos > CAPS[parentType].photos || audio > CAPS[parentType].audio) {
        throw new BadRequestException({
          code: 'ATTACHMENT_LIMIT_EXCEEDED',
          message: 'Attachment limit exceeded',
        });
      }
      if (parentType === 'letter') {
        await this.letters.updateOne(
          { _id: parentId, ownerId },
          { $addToSet: { attachmentIds: upload._id } },
        );
      } else if (parentType === 'memory') {
        await this.timeline.updateOne(
          { _id: parentId, ownerId },
          { $addToSet: { attachmentIds: upload._id } },
        );
      } else {
        await this.paths.updateOne(
          { _id: parentId, ownerId },
          { $addToSet: { attachmentIds: upload._id } },
        );
      }
    }
    upload.temporary = false;
    upload.parentType = parentType;
    upload.parentId =
      parentType === 'avatar'
        ? new Types.ObjectId(ownerId)
        : new Types.ObjectId(parentId);
    upload.expiresAt = new Date('9999-12-31T23:59:59.999Z');
    const saved = await upload.save();
    if (replacedAvatarId && !replacedAvatarId.equals(upload._id)) {
      await this.remove(ownerId, replacedAvatarId.toString());
    }
    return saved;
  }

  async remove(ownerId: string, id: string) {
    const upload = await this.uploads.findOneAndDelete({ _id: id, ownerId });
    if (!upload)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Upload not found',
      });
    await Promise.all([
      this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: upload.objectKey }),
      ),
      this.users.updateOne(
        { _id: ownerId, avatarUploadId: upload._id },
        { $unset: { avatarUploadId: 1 } },
      ),
      this.letters.updateMany(
        { ownerId },
        { $pull: { attachmentIds: upload._id } },
      ),
      this.timeline.updateMany(
        { ownerId },
        { $pull: { attachmentIds: upload._id } },
      ),
      this.paths.updateMany(
        { ownerId },
        { $pull: { attachmentIds: upload._id } },
      ),
    ]);
    return { deleted: true };
  }

  async purgeExpired() {
    const expired = await this.uploads
      .find({ temporary: true, expiresAt: { $lte: new Date() } })
      .limit(100);
    await Promise.all(
      expired.map((upload) =>
        this.remove(upload.ownerId.toString(), upload._id.toString()),
      ),
    );
    return expired.length;
  }
}

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'purpose', enum: PURPOSES })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024, files: 1 },
    }),
  )
  create(
    @CurrentUser() u: AuthUser,
    @Query('purpose') purpose: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.uploads.create(u.id, purpose, file);
  }

  @Get(':id/access')
  access(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.uploads.access(u.id, id);
  }

  @Post(':id/attach/:parentType/:parentId')
  attach(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Param('parentType') type: Purpose,
    @Param('parentId') parentId: string,
  ) {
    return this.uploads.attach(u.id, id, type, parentId);
  }

  @Delete(':id')
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.uploads.remove(u.id, id);
  }
}

@Module({
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
export class UploadsModule {}
