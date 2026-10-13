import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type Doc<T> = HydratedDocument<T>;

@Schema({ timestamps: true, versionKey: false })
export class User {
  _id: Types.ObjectId;
  @Prop({ required: true, unique: true, index: true }) googleSubject: string;
  @Prop({ required: true, lowercase: true }) email: string;
  @Prop({ required: true, default: true }) emailVerified: boolean;
  @Prop({ required: true, maxlength: 80 }) displayName: string;
  @Prop() birthDate?: string;
  @Prop() expectedLifespanYears?: number;
  @Prop({ required: true, default: 'UTC' }) timeZone: string;
  @Prop({ default: 'en' }) locale: string;
  @Prop({ type: Object, default: {} }) notificationPreferences: Record<
    string,
    unknown
  >;
  @Prop({ type: Object, default: {} }) privacySettings: Record<string, unknown>;
  @Prop() avatarUploadId?: Types.ObjectId;
  @Prop({ enum: ['active', 'deleting', 'deleted'], default: 'active' })
  accountState: string;
  createdAt: Date;
  updatedAt: Date;
}
export const UserSchema = SchemaFactory.createForClass(User);

@Schema({ timestamps: true, versionKey: false })
export class Session {
  _id: Types.ObjectId;
  @Prop({ required: true, index: true }) ownerId: Types.ObjectId;
  @Prop({ required: true, unique: true }) familyId: string;
  @Prop({ required: true }) tokenHash: string;
  @Prop({ required: true }) expiresAt: Date;
  @Prop() revokedAt?: Date;
  @Prop() replacedBy?: Types.ObjectId;
  @Prop() userAgent?: string;
  @Prop() ipHash?: string;
}
export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

@Schema({ timestamps: true, versionKey: false })
export class Goal {
  _id: Types.ObjectId;
  @Prop({ required: true, index: true }) ownerId: Types.ObjectId;
  @Prop({ required: true, maxlength: 120 }) title: string;
  @Prop({ maxlength: 2000 }) notes?: string;
  @Prop({ maxlength: 2000 }) whyItMatters?: string;
  @Prop({ enum: ['none', 'date', 'age'], default: 'none' })
  deadlineType: string;
  @Prop() deadlineDate?: string;
  @Prop() targetAge?: number;
  @Prop({ min: 0 }) preparationLeadDays?: number;
  @Prop({
    enum: ['active', 'completed', 'abandoned', 'archived'],
    default: 'active',
  })
  status: string;
  @Prop() completedAt?: Date;
  @Prop({ type: Object, default: { mode: 'default' } })
  reminder: Record<string, unknown>;
  @Prop({ type: [Object], default: [] }) milestones: Record<string, unknown>[];
  @Prop() deletedAt?: Date;
}
export const GoalSchema = SchemaFactory.createForClass(Goal);
GoalSchema.index({ ownerId: 1, deletedAt: 1, status: 1, createdAt: -1 });

@Schema({ timestamps: true, versionKey: false })
export class Timeline {
  _id: Types.ObjectId;
  @Prop({ required: true, index: true }) ownerId: Types.ObjectId;
  @Prop() goalId?: Types.ObjectId;
  @Prop({
    required: true,
    enum: ['goal_created', 'goal_updated', 'goal_status', 'memory'],
  })
  eventType: string;
  @Prop({ required: true }) occurredAt: Date;
  @Prop({ maxlength: 2000 }) note?: string;
  @Prop({ type: Object, required: true }) snapshot: Record<string, unknown>;
  @Prop({ type: [Types.ObjectId], default: [] })
  attachmentIds: Types.ObjectId[];
}
export const TimelineSchema = SchemaFactory.createForClass(Timeline);
TimelineSchema.index({ ownerId: 1, occurredAt: -1 });

@Schema({ timestamps: true, versionKey: false })
export class WhatIf {
  _id: Types.ObjectId;
  @Prop({ required: true, index: true }) ownerId: Types.ObjectId;
  @Prop({ required: true, maxlength: 120 }) title: string;
  @Prop({ maxlength: 2000 }) description?: string;
  @Prop({ type: [Types.ObjectId], default: [] })
  attachmentIds: Types.ObjectId[];
}
export const WhatIfSchema = SchemaFactory.createForClass(WhatIf);

@Schema({ timestamps: true, versionKey: false })
export class Upload {
  _id: Types.ObjectId;
  @Prop({ required: true, index: true }) ownerId: Types.ObjectId;
  @Prop({ required: true, unique: true }) objectKey: string;
  @Prop({ required: true }) contentType: string;
  @Prop({ required: true }) byteSize: number;
  @Prop({ required: true }) checksum: string;
  @Prop({ required: true, enum: ['avatar', 'letter', 'memory', 'what-if'] })
  purpose: string;
  @Prop({ default: true }) temporary: boolean;
  @Prop() parentType?: string;
  @Prop() parentId?: Types.ObjectId;
  @Prop({ required: true }) expiresAt: Date;
}
export const UploadSchema = SchemaFactory.createForClass(Upload);
UploadSchema.index({ temporary: 1, expiresAt: 1 });

@Schema({ timestamps: true, versionKey: false })
export class Letter {
  _id: Types.ObjectId;
  @Prop({ required: true, index: true }) ownerId: Types.ObjectId;
  @Prop({ required: true, maxlength: 10000 }) body: string;
  @Prop({ type: [Types.ObjectId], default: [] })
  attachmentIds: Types.ObjectId[];
  @Prop({ required: true, enum: ['date', 'age'] }) deliveryType: string;
  @Prop() deliveryDate?: string;
  @Prop() targetAge?: number;
  @Prop({ required: true }) scheduledAt: Date;
  @Prop({ required: true }) timeZone: string;
  @Prop({ default: true }) emailEnabled: boolean;
  @Prop({ default: true }) inAppEnabled: boolean;
  @Prop({
    enum: ['scheduled', 'delivering', 'delivered', 'cancelled', 'failed'],
    default: 'scheduled',
  })
  status: string;
  @Prop() deliveredAt?: Date;
}
export const LetterSchema = SchemaFactory.createForClass(Letter);

@Schema({ timestamps: true, versionKey: false })
export class Job {
  _id: Types.ObjectId;
  @Prop({ required: true, index: true }) ownerId: Types.ObjectId;
  @Prop({ required: true, enum: ['letter', 'reminder', 'cleanup', 'export'] })
  type: string;
  @Prop({ required: true }) resourceId: Types.ObjectId;
  @Prop({ required: true, unique: true }) idempotencyKey: string;
  @Prop({ required: true, index: true }) runAt: Date;
  @Prop({
    enum: ['pending', 'processing', 'completed', 'cancelled', 'failed'],
    default: 'pending',
  })
  status: string;
  @Prop({ default: 0 }) attempts: number;
  @Prop({ default: 5 }) maxAttempts: number;
  @Prop() leaseUntil?: Date;
  @Prop() workerId?: string;
  @Prop() lastErrorCode?: string;
  @Prop({ type: Object, default: {} }) result: Record<string, unknown>;
}
export const JobSchema = SchemaFactory.createForClass(Job);
JobSchema.index({ status: 1, runAt: 1, leaseUntil: 1 });

@Schema({ timestamps: true, versionKey: false })
export class AppUpdatePolicy {
  _id: Types.ObjectId;
  @Prop({ required: true, enum: ['android', 'ios'], unique: true })
  platform: string;
  @Prop({ required: true }) latestVersion: string;
  @Prop({ required: true }) minimumVersion: string;
  @Prop() minimumBuild?: number;
  @Prop({ required: true }) storeUrl: string;
  @Prop({ type: [String], default: [] }) releaseNotes: string[];
  @Prop({ default: true }) enabled: boolean;
  @Prop({ default: 1 }) policyVersion: number;
}
export const AppUpdatePolicySchema =
  SchemaFactory.createForClass(AppUpdatePolicy);

@Schema({ timestamps: true, versionKey: false })
export class Device {
  _id: Types.ObjectId;
  @Prop({ required: true, index: true }) ownerId: Types.ObjectId;
  @Prop({ required: true }) token: string;
  @Prop({ required: true, enum: ['android', 'ios'] }) platform: string;
  @Prop({ default: true }) enabled: boolean;
}
export const DeviceSchema = SchemaFactory.createForClass(Device);
DeviceSchema.index({ ownerId: 1, token: 1 }, { unique: true });
