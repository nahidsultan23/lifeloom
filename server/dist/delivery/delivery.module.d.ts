import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { type AuthUser } from '../common/api.js';
import { Device, Job, Letter, User } from '../database/schemas.js';
export declare class LetterDto {
    body: string;
    attachmentIds?: string[];
    deliveryType: 'date' | 'age';
    deliveryDate?: string;
    targetAge?: number;
    emailEnabled: boolean;
    inAppEnabled: boolean;
}
export declare class DeviceDto {
    token: string;
    platform: string;
}
export declare class DeliveryAdapters {
    private readonly config;
    private readonly mailer?;
    private readonly messaging?;
    constructor(config: ConfigService);
    email(to: string, letterId: string): Promise<string>;
    push(tokens: string[]): Promise<number>;
}
export declare class DeliveryService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly adapters;
    private readonly users;
    private readonly letters;
    private readonly jobs;
    private readonly devices;
    private timer?;
    private readonly workerId;
    constructor(config: ConfigService, adapters: DeliveryAdapters, users: Model<User>, letters: Model<Letter>, jobs: Model<Job>, devices: Model<Device>);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private calculateSchedule;
    createLetter(ownerId: string, dto: LetterDto): Promise<import("mongoose").Document<unknown, {}, Letter, {}, import("mongoose").DefaultSchemaOptions> & Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    list(ownerId: string): Promise<(Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    one(ownerId: string, id: string): Promise<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    reschedule(ownerId: string, id: string, dto: LetterDto): Promise<import("mongoose").Document<unknown, {}, Letter, {}, import("mongoose").DefaultSchemaOptions> & Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    cancel(ownerId: string, id: string): Promise<import("mongoose").Document<unknown, {}, Letter, {}, import("mongoose").DefaultSchemaOptions> & Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    registerDevice(ownerId: string, dto: DeviceDto): import("mongoose").Query<import("mongoose").Document<unknown, {}, Device, {}, import("mongoose").DefaultSchemaOptions> & Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, import("mongoose").Document<unknown, {}, Device, {}, import("mongoose").DefaultSchemaOptions> & Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "findOneAndUpdate", {}, Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    removeDevice(ownerId: string, token: string): Promise<{
        deleted: boolean;
    }>;
    tick(): Promise<boolean>;
    private deliverLetter;
}
export declare class LettersController {
    private readonly delivery;
    constructor(delivery: DeliveryService);
    create(u: AuthUser, dto: LetterDto): Promise<import("mongoose").Document<unknown, {}, Letter, {}, import("mongoose").DefaultSchemaOptions> & Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    list(u: AuthUser): Promise<(Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    one(u: AuthUser, id: string): Promise<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    reschedule(u: AuthUser, id: string, dto: LetterDto): Promise<import("mongoose").Document<unknown, {}, Letter, {}, import("mongoose").DefaultSchemaOptions> & Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    cancel(u: AuthUser, id: string): Promise<import("mongoose").Document<unknown, {}, Letter, {}, import("mongoose").DefaultSchemaOptions> & Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
export declare class DevicesController {
    private readonly delivery;
    constructor(delivery: DeliveryService);
    register(u: AuthUser, dto: DeviceDto): import("mongoose").Query<import("mongoose").Document<unknown, {}, Device, {}, import("mongoose").DefaultSchemaOptions> & Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, import("mongoose").Document<unknown, {}, Device, {}, import("mongoose").DefaultSchemaOptions> & Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "findOneAndUpdate", {}, Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    remove(u: AuthUser, token: string): Promise<{
        deleted: boolean;
    }>;
}
export declare class DeliveryModule {
}
