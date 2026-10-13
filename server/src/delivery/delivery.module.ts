import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  Param,
  Patch,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DateTime } from 'luxon';
import { Model, Types } from 'mongoose';
import nodemailer, { type Transporter } from 'nodemailer';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { randomUUID } from 'node:crypto';
import { CurrentUser, type AuthUser } from '../common/api.js';
import {
  Device,
  DeviceSchema,
  Goal,
  GoalSchema,
  Job,
  JobSchema,
  Letter,
  LetterSchema,
  User,
  UserSchema,
} from '../database/schemas.js';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class LetterDto {
  @IsString() @MaxLength(10000) body: string;
  @IsEnum(['date', 'age']) deliveryType: 'date' | 'age';
  @IsOptional() @Matches(DATE_ONLY) deliveryDate?: string;
  @IsOptional() @IsInt() @Min(1) @Max(150) targetAge?: number;
  @IsOptional() @IsBoolean() emailEnabled = true;
  @IsOptional() @IsBoolean() inAppEnabled = true;
}

export class DeviceDto {
  @IsString() @MaxLength(4096) token: string;
  @IsEnum(['android', 'ios']) platform: string;
}

@Injectable()
export class DeliveryAdapters {
  private readonly mailer?: Transporter;
  private readonly messaging?: Messaging;
  private readonly s3: S3Client;

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      region: config.get<string>('AWS_REGION'),
      endpoint: config.get<string>('S3_ENDPOINT_URL') || undefined,
      forcePathStyle: config.get<boolean>('S3_FORCE_PATH_STYLE', false),
    });
    if (
      config.get<boolean>('EMAIL_ENABLED') &&
      config.get<string>('EMAIL_DELIVERY_MODE') === 'smtp'
    ) {
      this.mailer = nodemailer.createTransport({
        host: config.get<string>('SMTP_HOST'),
        port: config.get<number>('SMTP_PORT', 587),
        secure: config.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: config.get<string>('SMTP_USER'),
          pass: config.get<string>('SMTP_PASSWORD'),
        },
      });
    }
    if (config.get<boolean>('PUSH_NOTIFICATIONS_ENABLED')) {
      const projectId = config.get<string>('FCM_PROJECT_ID');
      const clientEmail = config.get<string>('FCM_CLIENT_EMAIL');
      const privateKey = config
        .get<string>('FCM_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');
      if (projectId && clientEmail && privateKey) {
        const app =
          getApps()[0] ??
          initializeApp({
            credential: cert({ projectId, clientEmail, privateKey }),
          });
        this.messaging = getMessaging(app);
      }
    }
  }

  async email(to: string, letterId: string): Promise<string> {
    if (!this.mailer) return 'disabled';
    const appName = this.config.get<string>('APP_NAME', 'Lifeloom');
    const prefix = this.config.get<string>('API_PREFIX', 'api/v1');
    const link = `${this.config.getOrThrow<string>('PUBLIC_API_URL')}/${prefix}/letters/${letterId}`;
    const result = await this.mailer.sendMail({
      from: {
        name: this.config.get<string>('SMTP_FROM_NAME', appName),
        address: this.config.getOrThrow<string>('SMTP_FROM_EMAIL'),
      },
      to,
      subject: `${appName}: a future-self letter is ready`,
      text: `Your future-self letter is ready. Sign in to read it: ${link}`,
      html: `<p>Your future-self letter is ready.</p><p><a href="${link}">Sign in to read it</a></p>`,
    });
    return result.messageId;
  }

  async push(tokens: string[]): Promise<number> {
    if (!this.messaging || !tokens.length) return 0;
    const result = await this.messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: 'A future-self letter is ready',
        body: 'Open Lifeloom to read it.',
      },
      data: { type: 'future_letter' },
    });
    return result.successCount;
  }

  async pushReminder(tokens: string[]): Promise<number> {
    if (!this.messaging || !tokens.length) return 0;
    const result = await this.messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: 'A goal reminder',
        body: 'Open Lifeloom when you are ready to check in.',
      },
      data: { type: 'goal_reminder' },
    });
    return result.successCount;
  }

  async deletePrivateObject(objectKey: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.config.getOrThrow<string>('AWS_S3_BUCKET'),
        Key: objectKey,
      }),
    );
  }
}

@Injectable()
export class DeliveryService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private readonly workerId = randomUUID();

  constructor(
    private readonly config: ConfigService,
    private readonly adapters: DeliveryAdapters,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Letter.name) private readonly letters: Model<Letter>,
    @InjectModel(Job.name) private readonly jobs: Model<Job>,
    @InjectModel(Device.name) private readonly devices: Model<Device>,
    @InjectModel(Goal.name) private readonly goals: Model<Goal>,
  ) {}

  onModuleInit() {
    if (this.config.get<boolean>('BACKGROUND_JOBS_ENABLED', false)) {
      this.timer = setInterval(
        () => void this.tick(),
        this.config.get<number>('SCHEDULER_POLL_INTERVAL_MS', 5000),
      );
      this.timer.unref();
      void this.tick();
    }
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private calculateSchedule(user: User, dto: LetterDto): Date {
    if (dto.deliveryType === 'date') {
      const local = DateTime.fromISO(dto.deliveryDate ?? '', {
        zone: user.timeZone,
      }).startOf('day');
      if (!local.isValid || local <= DateTime.now())
        throw new UnprocessableEntityException({
          code: 'INVALID_DELIVERY_DATE',
          message: 'Delivery date must be in the future',
        });
      return local.toUTC().toJSDate();
    }
    if (!user.birthDate || !dto.targetAge) {
      throw new UnprocessableEntityException({
        code: 'BIRTH_DATE_REQUIRED',
        message: 'Birth date and target age are required',
      });
    }
    const birth = DateTime.fromISO(user.birthDate, { zone: user.timeZone });
    let delivery = birth.plus({ years: dto.targetAge }).startOf('day');
    if (birth.month === 2 && birth.day === 29 && !delivery.isValid) {
      delivery = DateTime.local(birth.year + dto.targetAge, 2, 28, {
        zone: user.timeZone,
      });
    }
    if (delivery <= DateTime.now())
      throw new UnprocessableEntityException({
        code: 'INVALID_DELIVERY_DATE',
        message: 'Delivery date must be in the future',
      });
    return delivery.toUTC().toJSDate();
  }

  async createLetter(ownerId: string, dto: LetterDto) {
    const user = await this.users.findById(ownerId);
    if (!user) throw new NotFoundException();
    const scheduledAt = this.calculateSchedule(user, dto);
    const letter = await this.letters.create({
      ownerId,
      ...dto,
      scheduledAt,
      timeZone: user.timeZone,
    });
    await this.jobs.create({
      ownerId,
      type: 'letter',
      resourceId: letter._id,
      idempotencyKey: `letter:${letter._id.toString()}:${scheduledAt.toISOString()}`,
      runAt: scheduledAt,
    });
    return letter;
  }

  async list(ownerId: string) {
    return this.letters.find({ ownerId }).sort({ scheduledAt: 1 }).lean();
  }

  async one(ownerId: string, id: string) {
    const letter = await this.letters.findOne({ _id: id, ownerId }).lean();
    if (!letter)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Letter not found',
      });
    return letter;
  }

  async reschedule(ownerId: string, id: string, dto: LetterDto) {
    const user = await this.users.findById(ownerId);
    const letter = await this.letters.findOne({
      _id: id,
      ownerId,
      status: 'scheduled',
    });
    if (!user || !letter)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Letter not found',
      });
    const scheduledAt = this.calculateSchedule(user, dto);
    Object.assign(letter, dto, { scheduledAt });
    await letter.save();
    await this.jobs.updateOne(
      { ownerId, resourceId: letter._id, type: 'letter', status: 'pending' },
      {
        $set: {
          runAt: scheduledAt,
          idempotencyKey: `letter:${letter._id.toString()}:${scheduledAt.toISOString()}`,
        },
      },
    );
    return letter;
  }

  async cancel(ownerId: string, id: string) {
    const letter = await this.letters.findOneAndUpdate(
      { _id: id, ownerId, status: 'scheduled' },
      { $set: { status: 'cancelled' } },
      { new: true },
    );
    if (!letter)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Letter not found',
      });
    await this.jobs.updateMany(
      {
        ownerId,
        resourceId: letter._id,
        status: { $in: ['pending', 'processing'] },
      },
      { $set: { status: 'cancelled' } },
    );
    return letter;
  }

  registerDevice(ownerId: string, dto: DeviceDto) {
    return this.devices.findOneAndUpdate(
      { ownerId, token: dto.token },
      { $set: { ...dto, enabled: true } },
      { upsert: true, new: true },
    );
  }

  async removeDevice(ownerId: string, token: string) {
    await this.devices.deleteOne({ ownerId, token });
    return { deleted: true };
  }

  async tick() {
    const now = new Date();
    const leaseUntil = new Date(
      now.getTime() +
        this.config.get<number>('SCHEDULER_LEASE_SECONDS', 60) * 1000,
    );
    const job = await this.jobs.findOneAndUpdate(
      {
        runAt: { $lte: now },
        $or: [
          { status: 'pending' },
          { status: 'processing', leaseUntil: { $lt: now } },
        ],
      },
      {
        $set: { status: 'processing', leaseUntil, workerId: this.workerId },
        $inc: { attempts: 1 },
      },
      { sort: { runAt: 1 }, new: true },
    );
    if (!job) return false;
    try {
      let rescheduled = false;
      if (job.type === 'letter') await this.deliverLetter(job);
      if (job.type === 'reminder')
        rescheduled = await this.deliverReminder(job);
      if (job.type === 'export' && typeof job.result.objectKey === 'string') {
        await this.adapters.deletePrivateObject(job.result.objectKey);
      }
      if (!rescheduled) {
        job.status = 'completed';
        job.result = { completedAt: new Date().toISOString() };
        await job.save();
      }
    } catch {
      const terminal = job.attempts >= job.maxAttempts;
      job.status = terminal ? 'failed' : 'pending';
      job.runAt = new Date(
        Date.now() + Math.min(3600000, 2 ** job.attempts * 30000),
      );
      job.lastErrorCode = 'DELIVERY_FAILED';
      await job.save();
      if (terminal) {
        await this.letters.updateOne(
          { _id: job.resourceId, ownerId: job.ownerId },
          { $set: { status: 'failed' } },
        );
      }
    }
    return true;
  }

  private async deliverLetter(job: Job) {
    const letter = await this.letters.findOneAndUpdate(
      {
        _id: job.resourceId,
        ownerId: job.ownerId,
        status: { $in: ['scheduled', 'delivering'] },
      },
      { $set: { status: 'delivering' } },
      { new: true },
    );
    if (!letter) return;
    const user = await this.users.findById(job.ownerId);
    if (!user?.emailVerified) throw new Error('recipient unavailable');
    if (letter.emailEnabled && !job.result.emailAttempted) {
      job.result = { ...job.result, emailAttempted: true };
      await job.save();
      await this.adapters.email(user.email, letter._id.toString());
      job.result = { ...job.result, emailSent: true };
      await job.save();
    }
    if (letter.inAppEnabled && !job.result.pushAttempted) {
      job.result = { ...job.result, pushAttempted: true };
      await job.save();
      const devices = await this.devices
        .find({ ownerId: job.ownerId, enabled: true })
        .lean();
      await this.adapters.push(devices.map((device) => device.token));
      job.result = { ...job.result, pushSent: true };
      await job.save();
    