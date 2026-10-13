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
import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, UnprocessableEntityException, UseGuards, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, } from 'class-validator';
import { DateTime } from 'luxon';
import { Model } from 'mongoose';
import nodemailer from 'nodemailer';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { randomUUID } from 'node:crypto';
import { CurrentUser } from '../common/api.js';
import { Device, DeviceSchema, Job, JobSchema, Letter, LetterSchema, User, UserSchema, } from '../database/schemas.js';
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
export class LetterDto {
    body;
    attachmentIds;
    deliveryType;
    deliveryDate;
    targetAge;
    emailEnabled = true;
    inAppEnabled = true;
}
__decorate([
    IsString(),
    MaxLength(10000),
    __metadata("design:type", String)
], LetterDto.prototype, "body", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], LetterDto.prototype, "attachmentIds", void 0);
__decorate([
    IsEnum(['date', 'age']),
    __metadata("design:type", String)
], LetterDto.prototype, "deliveryType", void 0);
__decorate([
    IsOptional(),
    Matches(DATE_ONLY),
    __metadata("design:type", String)
], LetterDto.prototype, "deliveryDate", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(150),
    __metadata("design:type", Number)
], LetterDto.prototype, "targetAge", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Object)
], LetterDto.prototype, "emailEnabled", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Object)
], LetterDto.prototype, "inAppEnabled", void 0);
export class DeviceDto {
    token;
    platform;
}
__decorate([
    IsString(),
    MaxLength(4096),
    __metadata("design:type", String)
], DeviceDto.prototype, "token", void 0);
__decorate([
    IsEnum(['android', 'ios']),
    __metadata("design:type", String)
], DeviceDto.prototype, "platform", void 0);
let DeliveryAdapters = class DeliveryAdapters {
    config;
    mailer;
    messaging;
    constructor(config) {
        this.config = config;
        if (config.get('EMAIL_ENABLED') &&
            config.get('EMAIL_DELIVERY_MODE') === 'smtp') {
            this.mailer = nodemailer.createTransport({
                host: config.get('SMTP_HOST'),
                port: config.get('SMTP_PORT', 587),
                secure: config.get('SMTP_SECURE', false),
                auth: {
                    user: config.get('SMTP_USER'),
                    pass: config.get('SMTP_PASSWORD'),
                },
            });
        }
        if (config.get('PUSH_NOTIFICATIONS_ENABLED')) {
            const projectId = config.get('FCM_PROJECT_ID');
            const clientEmail = config.get('FCM_CLIENT_EMAIL');
            const privateKey = config.get('FCM_PRIVATE_KEY')?.replace(/\\n/g, '\n');
            if (projectId && clientEmail && privateKey) {
                const app = getApps()[0] ??
                    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
                this.messaging = getMessaging(app);
            }
        }
    }
    async email(to, letterId) {
        if (!this.mailer)
            return 'disabled';
        const appName = this.config.get('APP_NAME', 'Lifeloom');
        const link = `${this.config.getOrThrow('PUBLIC_API_URL')}/letters/${letterId}`;
        const result = await this.mailer.sendMail({
            from: {
                name: this.config.get('SMTP_FROM_NAME', appName),
                address: this.config.getOrThrow('SMTP_FROM_EMAIL'),
            },
            to,
            subject: `${appName}: a future-self letter is ready`,
            text: `Your future-self letter is ready. Sign in to read it: ${link}`,
            html: `<p>Your future-self letter is ready.</p><p><a href="${link}">Sign in to read it</a></p>`,
        });
        return result.messageId;
    }
    async push(tokens) {
        if (!this.messaging || !tokens.length)
            return 0;
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
};
DeliveryAdapters = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], DeliveryAdapters);
export { DeliveryAdapters };
let DeliveryService = class DeliveryService {
    config;
    adapters;
    users;
    letters;
    jobs;
    devices;
    timer;
    workerId = randomUUID();
    constructor(config, adapters, users, letters, jobs, devices) {
        this.config = config;
        this.adapters = adapters;
        this.users = users;
        this.letters = letters;
        this.jobs = jobs;
        this.devices = devices;
    }
    onModuleInit() {
        if (this.config.get('BACKGROUND_JOBS_ENABLED', false)) {
            this.timer = setInterval(() => void this.tick(), this.config.get('SCHEDULER_POLL_INTERVAL_MS', 5000));
            this.timer.unref();
            void this.tick();
        }
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    calculateSchedule(user, dto) {
        if (dto.deliveryType === 'date') {
            const local = DateTime.fromISO(dto.deliveryDate ?? '', { zone: user.timeZone }).startOf('day');
            if (!local.isValid || local <= DateTime.now())
                throw new UnprocessableEntityException({ code: 'INVALID_DELIVERY_DATE', message: 'Delivery date must be in the future' });
            return local.toUTC().toJSDate();
        }
        if (!user.birthDate || !dto.targetAge) {
            throw new UnprocessableEntityException({ code: 'BIRTH_DATE_REQUIRED', message: 'Birth date and target age are required' });
        }
        const birth = DateTime.fromISO(user.birthDate, { zone: user.timeZone });
        let delivery = birth.plus({ years: dto.targetAge }).startOf('day');
        if (birth.month === 2 && birth.day === 29 && !delivery.isValid) {
            delivery = DateTime.local(birth.year + dto.targetAge, 2, 28, { zone: user.timeZone });
        }
        if (delivery <= DateTime.now())
            throw new UnprocessableEntityException({ code: 'INVALID_DELIVERY_DATE', message: 'Delivery date must be in the future' });
        return delivery.toUTC().toJSDate();
    }
    async createLetter(ownerId, dto) {
        const user = await this.users.findById(ownerId);
        if (!user)
            throw new NotFoundException();
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
    async list(ownerId) {
        return this.letters.find({ ownerId }).sort({ scheduledAt: 1 }).lean();
    }
    async one(ownerId, id) {
        const letter = await this.letters.findOne({ _id: id, ownerId }).lean();
        if (!letter)
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Letter not found' });
        return letter;
    }
    async reschedule(ownerId, id, dto) {
        const user = await this.users.findById(ownerId);
        const letter = await this.letters.findOne({ _id: id, ownerId, status: 'scheduled' });
        if (!user || !letter)
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Letter not found' });
        const scheduledAt = this.calculateSchedule(user, dto);
        Object.assign(letter, dto, { scheduledAt });
        await letter.save();
        await this.jobs.updateOne({ ownerId, resourceId: letter._id, type: 'letter', status: 'pending' }, {
            $set: {
                runAt: scheduledAt,
                idempotencyKey: `letter:${letter._id.toString()}:${scheduledAt.toISOString()}`,
            },
        });
        return letter;
    }
    async cancel(ownerId, id) {
        const letter = await this.letters.findOneAndUpdate({ _id: id, ownerId, status: 'scheduled' }, { $set: { status: 'cancelled' } }, { new: true });
        if (!letter)
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Letter not found' });
        await this.jobs.updateMany({ ownerId, resourceId: letter._id, status: { $in: ['pending', 'processing'] } }, { $set: { status: 'cancelled' } });
        return letter;
    }
    registerDevice(ownerId, dto) {
        return this.devices.findOneAndUpdate({ ownerId, token: dto.token }, { $set: { ...dto, enabled: true } }, { upsert: true, new: true });
    }
    async removeDevice(ownerId, token) {
        await this.devices.deleteOne({ ownerId, token });
        return { deleted: true };
    }
    async tick() {
        const now = new Date();
        const leaseUntil = new Date(now.getTime() + this.config.get('SCHEDULER_LEASE_SECONDS', 60) * 1000);
        const job = await this.jobs.findOneAndUpdate({
            runAt: { $lte: now },
            $or: [
                { status: 'pending' },
                { status: 'processing', leaseUntil: { $lt: now } },
            ],
        }, {
            $set: { status: 'processing', leaseUntil, workerId: this.workerId },
            $inc: { attempts: 1 },
        }, { sort: { runAt: 1 }, new: true });
        if (!job)
            return false;
        try {
            if (job.type === 'letter')
                await this.deliverLetter(job);
            job.status = 'completed';
            job.result = { completedAt: new Date().toISOString() };
            await job.save();
        }
        catch {
            const terminal = job.attempts >= job.maxAttempts;
            job.status = terminal ? 'failed' : 'pending';
            job.runAt = new Date(Date.now() + Math.min(3600000, 2 ** job.attempts * 30000));
            job.lastErrorCode = 'DELIVERY_FAILED';
            await job.save();
            if (terminal) {
                await this.letters.updateOne({ _id: job.resourceId, ownerId: job.ownerId }, { $set: { status: 'failed' } });
            }
        }
        return true;
    }
    async deliverLetter(job) {
        const letter = await this.letters.findOneAndUpdate({ _id: job.resourceId, ownerId: job.ownerId, status: 'scheduled' }, { $set: { status: 'delivering' } }, { new: true });
        if (!letter)
            return;
        const user = await this.users.findById(job.ownerId);
        if (!user?.emailVerified)
            throw new Error('recipient unavailable');
        if (letter.emailEnabled)
            await this.adapters.email(user.email, letter._id.toString());
        if (letter.inAppEnabled) {
            const devices = await this.devices.find({ ownerId: job.ownerId, enabled: true }).lean();
            await this.adapters.push(devices.map((device) => device.token));
        }
        letter.status = 'delivered';
        letter.deliveredAt = new Date();
        await letter.save();
    }
};
DeliveryService = __decorate([
    Injectable(),
    __param(2, InjectModel(User.name)),
    __param(3, InjectModel(Letter.name)),
    __param(4, InjectModel(Job.name)),
    __param(5, InjectModel(Device.name)),
    __metadata("design:paramtypes", [ConfigService,
        DeliveryAdapters,
        Model,
        Model,
        Model,
        Model])
], DeliveryService);
export { DeliveryService };
let LettersController = class LettersController {
    delivery;
    constructor(delivery) {
        this.delivery = delivery;
    }
    create(u, dto) { return this.delivery.createLetter(u.id, dto); }
    list(u) { return this.delivery.list(u.id); }
    one(u, id) { return this.delivery.one(u.id, id); }
    reschedule(u, id, dto) { return this.delivery.reschedule(u.id, id, dto); }
    cancel(u, id) { return this.delivery.cancel(u.id, id); }
};
__decorate([
    Post(),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, LetterDto]),
    __metadata("design:returntype", void 0)
], LettersController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LettersController.prototype, "list", null);
__decorate([
    Get(':id'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LettersController.prototype, "one", null);
__decorate([
    Patch(':id'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, LetterDto]),
    __metadata("design:returntype", void 0)
], LettersController.prototype, "reschedule", null);
__decorate([
    Delete(':id'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LettersController.prototype, "cancel", null);
LettersController = __decorate([
    ApiTags('letters'),
    ApiBearerAuth(),
    UseGuards(AuthGuard('jwt')),
    Controller('letters'),
    __metadata("design:paramtypes", [DeliveryService])
], LettersController);
export { LettersController };
let DevicesController = class DevicesController {
    delivery;
    constructor(delivery) {
        this.delivery = delivery;
    }
    register(u, dto) { return this.delivery.registerDevice(u.id, dto); }
    remove(u, token) { return this.delivery.removeDevice(u.id, token); }
};
__decorate([
    Post(),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, DeviceDto]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "register", null);
__decorate([
    Delete(':token'),
    __param(0, CurrentUser()),
    __param(1, Param('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "remove", null);
DevicesController = __decorate([
    ApiTags('devices'),
    ApiBearerAuth(),
    UseGuards(AuthGuard('jwt')),
    Controller('devices'),
    __metadata("design:paramtypes", [DeliveryService])
], DevicesController);
export { DevicesController };
let DeliveryModule = class DeliveryModule {
};
DeliveryModule = __decorate([
    Module({
        imports: [
            MongooseModule.forFeature([
                { name: User.name, schema: UserSchema },
                { name: Letter.name, schema: LetterSchema },
                { name: Job.name, schema: JobSchema },
                { name: Device.name, schema: DeviceSchema },
            ]),
        ],
        providers: [DeliveryService, DeliveryAdapters],
        controllers: [LettersController, DevicesController],
        exports: [DeliveryService],
    })
], DeliveryModule);
export { DeliveryModule };
//# sourceMappingURL=delivery.module.js.map