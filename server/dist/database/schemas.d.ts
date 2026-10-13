import { HydratedDocument, Types } from 'mongoose';
export type Doc<T> = HydratedDocument<T>;
export declare class User {
    _id: Types.ObjectId;
    googleSubject: string;
    email: string;
    emailVerified: boolean;
    displayName: string;
    birthDate?: string;
    expectedLifespanYears?: number;
    timeZone: string;
    locale: string;
    notificationPreferences: Record<string, unknown>;
    privacySettings: Record<string, unknown>;
    avatarUploadId?: Types.ObjectId;
    accountState: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, any, any, User & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, import("mongoose").Document<unknown, {}, User, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    googleSubject?: import("mongoose").SchemaDefinitionProperty<string, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    emailVerified?: import("mongoose").SchemaDefinitionProperty<boolean, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    displayName?: import("mongoose").SchemaDefinitionProperty<string, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    birthDate?: import("mongoose").SchemaDefinitionProperty<string | undefined, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    expectedLifespanYears?: import("mongoose").SchemaDefinitionProperty<number | undefined, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    timeZone?: import("mongoose").SchemaDefinitionProperty<string, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    locale?: import("mongoose").SchemaDefinitionProperty<string, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    notificationPreferences?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    privacySettings?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    avatarUploadId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    accountState?: import("mongoose").SchemaDefinitionProperty<string, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date, User, import("mongoose").Document<unknown, {}, User, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, User>;
export declare class Session {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    familyId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date;
    replacedBy?: Types.ObjectId;
    userAgent?: string;
    ipHash?: string;
}
export declare const SessionSchema: import("mongoose").Schema<Session, import("mongoose").Model<Session, any, any, any, any, any, Session & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Session, import("mongoose").Document<unknown, {}, Session, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Session & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Session, import("mongoose").Document<unknown, {}, Session, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Session & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    ownerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Session, import("mongoose").Document<unknown, {}, Session, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Session & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    familyId?: import("mongoose").SchemaDefinitionProperty<string, Session, import("mongoose").Document<unknown, {}, Session, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Session & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    tokenHash?: import("mongoose").SchemaDefinitionProperty<string, Session, import("mongoose").Document<unknown, {}, Session, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Session & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date, Session, import("mongoose").Document<unknown, {}, Session, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Session & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    revokedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Session, import("mongoose").Document<unknown, {}, Session, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Session & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    replacedBy?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Session, import("mongoose").Document<unknown, {}, Session, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Session & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    userAgent?: import("mongoose").SchemaDefinitionProperty<string | undefined, Session, import("mongoose").Document<unknown, {}, Session, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Session & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    ipHash?: import("mongoose").SchemaDefinitionProperty<string | undefined, Session, import("mongoose").Document<unknown, {}, Session, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Session & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Session>;
export declare class Goal {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    title: string;
    notes?: string;
    whyItMatters?: string;
    deadlineType: string;
    deadlineDate?: string;
    targetAge?: number;
    preparationLeadDays?: number;
    status: string;
    completedAt?: Date;
    reminder: Record<string, unknown>;
    milestones: Record<string, unknown>[];
    deletedAt?: Date;
}
export declare const GoalSchema: import("mongoose").Schema<Goal, import("mongoose").Model<Goal, any, any, any, any, any, Goal & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Goal, import("mongoose").Document<unknown, {}, Goal, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    ownerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    title?: import("mongoose").SchemaDefinitionProperty<string, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    notes?: import("mongoose").SchemaDefinitionProperty<string | undefined, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    whyItMatters?: import("mongoose").SchemaDefinitionProperty<string | undefined, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    deadlineType?: import("mongoose").SchemaDefinitionProperty<string, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    deadlineDate?: import("mongoose").SchemaDefinitionProperty<string | undefined, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    targetAge?: import("mongoose").SchemaDefinitionProperty<number | undefined, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    preparationLeadDays?: import("mongoose").SchemaDefinitionProperty<number | undefined, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    completedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    reminder?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    milestones?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>[], Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    deletedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Goal, import("mongoose").Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Goal>;
export declare class Timeline {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    goalId?: Types.ObjectId;
    eventType: string;
    occurredAt: Date;
    note?: string;
    snapshot: Record<string, unknown>;
    attachmentIds: Types.ObjectId[];
}
export declare const TimelineSchema: import("mongoose").Schema<Timeline, import("mongoose").Model<Timeline, any, any, any, any, any, Timeline & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Timeline, import("mongoose").Document<unknown, {}, Timeline, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Timeline & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Timeline, import("mongoose").Document<unknown, {}, Timeline, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Timeline & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    ownerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Timeline, import("mongoose").Document<unknown, {}, Timeline, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Timeline & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    goalId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Timeline, import("mongoose").Document<unknown, {}, Timeline, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Timeline & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    eventType?: import("mongoose").SchemaDefinitionProperty<string, Timeline, import("mongoose").Document<unknown, {}, Timeline, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Timeline & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    occurredAt?: import("mongoose").SchemaDefinitionProperty<Date, Timeline, import("mongoose").Document<unknown, {}, Timeline, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Timeline & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    note?: import("mongoose").SchemaDefinitionProperty<string | undefined, Timeline, import("mongoose").Document<unknown, {}, Timeline, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Timeline & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    snapshot?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, Timeline, import("mongoose").Document<unknown, {}, Timeline, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Timeline & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    attachmentIds?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Timeline, import("mongoose").Document<unknown, {}, Timeline, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Timeline & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Timeline>;
export declare class WhatIf {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    title: string;
    description?: string;
    attachmentIds: Types.ObjectId[];
}
export declare const WhatIfSchema: import("mongoose").Schema<WhatIf, import("mongoose").Model<WhatIf, any, any, any, any, any, WhatIf & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WhatIf, import("mongoose").Document<unknown, {}, WhatIf, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<WhatIf & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WhatIf, import("mongoose").Document<unknown, {}, WhatIf, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WhatIf & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    ownerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WhatIf, import("mongoose").Document<unknown, {}, WhatIf, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WhatIf & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    title?: import("mongoose").SchemaDefinitionProperty<string, WhatIf, import("mongoose").Document<unknown, {}, WhatIf, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WhatIf & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | undefined, WhatIf, import("mongoose").Document<unknown, {}, WhatIf, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WhatIf & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    attachmentIds?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], WhatIf, import("mongoose").Document<unknown, {}, WhatIf, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WhatIf & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, WhatIf>;
export declare class Upload {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    objectKey: string;
    contentType: string;
    byteSize: number;
    checksum: string;
    purpose: string;
    temporary: boolean;
    parentType?: string;
    parentId?: Types.ObjectId;
    expiresAt: Date;
}
export declare const UploadSchema: import("mongoose").Schema<Upload, import("mongoose").Model<Upload, any, any, any, any, any, Upload & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Upload, import("mongoose").Document<unknown, {}, Upload, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Upload & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Upload, import("mongoose").Document<unknown, {}, Upload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    ownerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Upload, import("mongoose").Document<unknown, {}, Upload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    objectKey?: import("mongoose").SchemaDefinitionProperty<string, Upload, import("mongoose").Document<unknown, {}, Upload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    contentType?: import("mongoose").SchemaDefinitionProperty<string, Upload, import("mongoose").Document<unknown, {}, Upload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    byteSize?: import("mongoose").SchemaDefinitionProperty<number, Upload, import("mongoose").Document<unknown, {}, Upload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    checksum?: import("mongoose").SchemaDefinitionProperty<string, Upload, import("mongoose").Document<unknown, {}, Upload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    purpose?: import("mongoose").SchemaDefinitionProperty<string, Upload, import("mongoose").Document<unknown, {}, Upload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    temporary?: import("mongoose").SchemaDefinitionProperty<boolean, Upload, import("mongoose").Document<unknown, {}, Upload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    parentType?: import("mongoose").SchemaDefinitionProperty<string | undefined, Upload, import("mongoose").Document<unknown, {}, Upload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    parentId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | undefined, Upload, import("mongoose").Document<unknown, {}, Upload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date, Upload, import("mongoose").Document<unknown, {}, Upload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Upload & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Upload>;
export declare class Letter {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    body: string;
    attachmentIds: Types.ObjectId[];
    deliveryType: string;
    deliveryDate?: string;
    targetAge?: number;
    scheduledAt: Date;
    timeZone: string;
    emailEnabled: boolean;
    inAppEnabled: boolean;
    status: string;
    deliveredAt?: Date;
}
export declare const LetterSchema: import("mongoose").Schema<Letter, import("mongoose").Model<Letter, any, any, any, any, any, Letter & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Letter, import("mongoose").Document<unknown, {}, Letter, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    ownerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    body?: import("mongoose").SchemaDefinitionProperty<string, Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    attachmentIds?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    deliveryType?: import("mongoose").SchemaDefinitionProperty<string, Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    deliveryDate?: import("mongoose").SchemaDefinitionProperty<string | undefined, Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    targetAge?: import("mongoose").SchemaDefinitionProperty<number | undefined, Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    scheduledAt?: import("mongoose").SchemaDefinitionProperty<Date, Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    timeZone?: import("mongoose").SchemaDefinitionProperty<string, Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    emailEnabled?: import("mongoose").SchemaDefinitionProperty<boolean, Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    inAppEnabled?: import("mongoose").SchemaDefinitionProperty<boolean, Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    deliveredAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Letter, import("mongoose").Document<unknown, {}, Letter, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Letter & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Letter>;
export declare class Job {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    type: string;
    resourceId: Types.ObjectId;
    idempotencyKey: string;
    runAt: Date;
    status: string;
    attempts: number;
    maxAttempts: number;
    leaseUntil?: Date;
    workerId?: string;
    lastErrorCode?: string;
    result: Record<string, unknown>;
}
export declare const JobSchema: import("mongoose").Schema<Job, import("mongoose").Model<Job, any, any, any, any, any, Job & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Job, import("mongoose").Document<unknown, {}, Job, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    ownerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<string, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    resourceId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    idempotencyKey?: import("mongoose").SchemaDefinitionProperty<string, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    runAt?: import("mongoose").SchemaDefinitionProperty<Date, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    attempts?: import("mongoose").SchemaDefinitionProperty<number, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    maxAttempts?: import("mongoose").SchemaDefinitionProperty<number, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    leaseUntil?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    workerId?: import("mongoose").SchemaDefinitionProperty<string | undefined, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastErrorCode?: import("mongoose").SchemaDefinitionProperty<string | undefined, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    result?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, Job, import("mongoose").Document<unknown, {}, Job, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Job & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Job>;
export declare class AppUpdatePolicy {
    _id: Types.ObjectId;
    platform: string;
    latestVersion: string;
    minimumVersion: string;
    minimumBuild?: number;
    storeUrl: string;
    releaseNotes: string[];
    enabled: boolean;
    policyVersion: number;
}
export declare const AppUpdatePolicySchema: import("mongoose").Schema<AppUpdatePolicy, import("mongoose").Model<AppUpdatePolicy, any, any, any, any, any, AppUpdatePolicy & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AppUpdatePolicy, import("mongoose").Document<unknown, {}, AppUpdatePolicy, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AppUpdatePolicy & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, AppUpdatePolicy, import("mongoose").Document<unknown, {}, AppUpdatePolicy, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppUpdatePolicy & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    platform?: import("mongoose").SchemaDefinitionProperty<string, AppUpdatePolicy, import("mongoose").Document<unknown, {}, AppUpdatePolicy, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppUpdatePolicy & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    latestVersion?: import("mongoose").SchemaDefinitionProperty<string, AppUpdatePolicy, import("mongoose").Document<unknown, {}, AppUpdatePolicy, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppUpdatePolicy & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    minimumVersion?: import("mongoose").SchemaDefinitionProperty<string, AppUpdatePolicy, import("mongoose").Document<unknown, {}, AppUpdatePolicy, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppUpdatePolicy & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    minimumBuild?: import("mongoose").SchemaDefinitionProperty<number | undefined, AppUpdatePolicy, import("mongoose").Document<unknown, {}, AppUpdatePolicy, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppUpdatePolicy & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    storeUrl?: import("mongoose").SchemaDefinitionProperty<string, AppUpdatePolicy, import("mongoose").Document<unknown, {}, AppUpdatePolicy, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppUpdatePolicy & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    releaseNotes?: import("mongoose").SchemaDefinitionProperty<string[], AppUpdatePolicy, import("mongoose").Document<unknown, {}, AppUpdatePolicy, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppUpdatePolicy & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    enabled?: import("mongoose").SchemaDefinitionProperty<boolean, AppUpdatePolicy, import("mongoose").Document<unknown, {}, AppUpdatePolicy, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppUpdatePolicy & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    policyVersion?: import("mongoose").SchemaDefinitionProperty<number, AppUpdatePolicy, import("mongoose").Document<unknown, {}, AppUpdatePolicy, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AppUpdatePolicy & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, AppUpdatePolicy>;
export declare class Device {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    token: string;
    platform: string;
    enabled: boolean;
}
export declare const DeviceSchema: import("mongoose").Schema<Device, import("mongoose").Model<Device, any, any, any, any, any, Device & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Device, import("mongoose").Document<unknown, {}, Device, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Device & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    ownerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    token?: import("mongoose").SchemaDefinitionProperty<string, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    platform?: import("mongoose").SchemaDefinitionProperty<string, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    enabled?: import("mongoose").SchemaDefinitionProperty<boolean, Device, import("mongoose").Document<unknown, {}, Device, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Device & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Device>;
