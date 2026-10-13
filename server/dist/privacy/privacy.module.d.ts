import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { type AuthUser } from '../common/api.js';
import { AppUpdatePolicy, Device, Goal, Job, Letter, Session, Timeline, Upload, User, WhatIf } from '../database/schemas.js';
export declare class DeleteAccountDto {
    confirmation: string;
}
export declare class UpdateCheckDto {
    platform: 'android' | 'ios';
    version: string;
    build: number;
    appIdentifier: string;
}
export declare class AppUpdatesService {
    private readonly policies;
    private readonly config;
    constructor(policies: Model<AppUpdatePolicy>, config: ConfigService);
    check(dto: UpdateCheckDto): Promise<{
        updateAvailable: boolean;
        required: boolean;
        policy: null;
    } | {
        updateAvailable: boolean;
        required: boolean;
        policy: {
            latestVersion: string;
            minimumVersion: string;
            minimumBuild: number | undefined;
            storeUrl: string;
            releaseNotes: string[];
            policyVersion: number;
        };
    }>;
}
export declare class UpdateRequiredGuard implements CanActivate {
    private readonly updates;
    constructor(updates: AppUpdatesService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class PrivacyService {
    private readonly config;
    private readonly users;
    private readonly sessions;
    private readonly goals;
    private readonly timeline;
    private readonly paths;
    private readonly letters;
    private readonly jobs;
    private readonly uploads;
    private readonly devices;
    private readonly s3;
    private readonly bucket;
    constructor(config: ConfigService, users: Model<User>, sessions: Model<Session>, goals: Model<Goal>, timeline: Model<Timeline>, paths: Model<WhatIf>, letters: Model<Letter>, jobs: Model<Job>, uploads: Model<Upload>, devices: Model<Device>);
    export(ownerId: string): Promise<{
        url: string;
        expiresIn: number;
        format: string;
        includesFileMetadata: boolean;
    }>;
    deleteAccount(ownerId: string, confirmation: string): Promise<{
        deleted: boolean;
        backupNotice: string;
    }>;
}
export declare class PrivacyController {
    private readonly privacy;
    constructor(privacy: PrivacyService);
    export(u: AuthUser): Promise<{
        url: string;
        expiresIn: number;
        format: string;
        includesFileMetadata: boolean;
    }>;
    remove(u: AuthUser, dto: DeleteAccountDto): Promise<{
        deleted: boolean;
        backupNotice: string;
    }>;
}
export declare class AppUpdatesController {
    private readonly updates;
    constructor(updates: AppUpdatesService);
    check(dto: UpdateCheckDto): Promise<{
        updateAvailable: boolean;
        required: boolean;
        policy: null;
    } | {
        updateAvailable: boolean;
        required: boolean;
        policy: {
            latestVersion: string;
            minimumVersion: string;
            minimumBuild: number | undefined;
            storeUrl: string;
            releaseNotes: string[];
            policyVersion: number;
        };
    }>;
}
export declare class PrivacyModule {
}
