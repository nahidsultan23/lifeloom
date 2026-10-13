import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { type AuthUser } from '../common/api.js';
import { Goal, Letter, Timeline, Upload, User, WhatIf } from '../database/schemas.js';
declare const PURPOSES: readonly ["avatar", "letter", "memory", "what-if"];
type Purpose = (typeof PURPOSES)[number];
export declare class UploadsService {
    private readonly config;
    private readonly uploads;
    private readonly users;
    private readonly letters;
    private readonly timeline;
    private readonly paths;
    private readonly goals;
    private readonly s3;
    private readonly bucket;
    constructor(config: ConfigService, uploads: Model<Upload>, users: Model<User>, letters: Model<Letter>, timeline: Model<Timeline>, paths: Model<WhatIf>, goals: Model<Goal>);
    private frameImage;
    create(ownerId: string, purposeRaw: string, file?: Express.Multer.File): Promise<import("mongoose").Document<unknown, {}, Upload, {}, import("mongoose").DefaultSchemaOptions> & Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    access(ownerId: string, id: string): Promise<{
        url: string;
        expiresIn: number;
    }>;
    attach(ownerId: string, uploadId: string, parentType: Purpose, parentId: string): Promise<import("mongoose").Document<unknown, {}, Upload, {}, import("mongoose").DefaultSchemaOptions> & Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(ownerId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    purgeExpired(): Promise<number>;
}
export declare class UploadsController {
    private readonly uploads;
    constructor(uploads: UploadsService);
    create(u: AuthUser, purpose: string, file?: Express.Multer.File): Promise<import("mongoose").Document<unknown, {}, Upload, {}, import("mongoose").DefaultSchemaOptions> & Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    access(u: AuthUser, id: string): Promise<{
        url: string;
        expiresIn: number;
    }>;
    attach(u: AuthUser, id: string, type: Purpose, parentId: string): Promise<import("mongoose").Document<unknown, {}, Upload, {}, import("mongoose").DefaultSchemaOptions> & Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(u: AuthUser, id: string): Promise<{
        deleted: boolean;
    }>;
}
export declare class UploadsModule {
}
export {};
