import { Model } from 'mongoose';
import { type AuthUser } from '../common/api.js';
import { User } from '../database/schemas.js';
export declare class UpdateProfileDto {
    displayName?: string;
    birthDate?: string;
    expectedLifespanYears?: number | null;
    timeZone?: string;
    locale?: string;
    notificationPreferences?: Record<string, unknown>;
}
export declare class UsersService {
    private readonly users;
    constructor(users: Model<User>);
    get(ownerId: string): Promise<{
        _id: import("mongoose").Types.ObjectId;
        email: string;
        emailVerified: boolean;
        displayName: string;
        birthDate?: string;
        expectedLifespanYears?: number;
        timeZone: string;
        locale: string;
        notificationPreferences: Record<string, unknown>;
        privacySettings: Record<string, unknown>;
        avatarUploadId?: import("mongoose").Types.ObjectId;
        accountState: string;
        createdAt: Date;
        updatedAt: Date;
        __v: number;
    } | null>;
    update(ownerId: string, dto: UpdateProfileDto): Promise<(User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
}
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    me(user: AuthUser): Promise<{
        _id: import("mongoose").Types.ObjectId;
        email: string;
        emailVerified: boolean;
        displayName: string;
        birthDate?: string;
        expectedLifespanYears?: number;
        timeZone: string;
        locale: string;
        notificationPreferences: Record<string, unknown>;
        privacySettings: Record<string, unknown>;
        avatarUploadId?: import("mongoose").Types.ObjectId;
        accountState: string;
        createdAt: Date;
        updatedAt: Date;
        __v: number;
    } | null>;
    update(user: AuthUser, dto: UpdateProfileDto): Promise<(User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
}
export declare class UsersModule {
}
