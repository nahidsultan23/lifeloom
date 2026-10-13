var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
let User = class User {
    _id;
    googleSubject;
    email;
    emailVerified;
    displayName;
    birthDate;
    expectedLifespanYears;
    timeZone;
    locale;
    notificationPreferences;
    privacySettings;
    avatarUploadId;
    accountState;
    createdAt;
    updatedAt;
};
__decorate([
    Prop({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], User.prototype, "googleSubject", void 0);
__decorate([
    Prop({ required: true, lowercase: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Prop({ required: true, default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "emailVerified", void 0);
__decorate([
    Prop({ required: true, maxlength: 80 }),
    __metadata("design:type", String)
], User.prototype, "displayName", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], User.prototype, "birthDate", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Number)
], User.prototype, "expectedLifespanYears", void 0);
__decorate([
    Prop({ required: true, default: 'UTC' }),
    __metadata("design:type", String)
], User.prototype, "timeZone", void 0);
__decorate([
    Prop({ default: 'en' }),
    __metadata("design:type", String)
], User.prototype, "locale", void 0);
__decorate([
    Prop({ type: Object, default: {} }),
    __metadata("design:type", Object)
], User.prototype, "notificationPreferences", void 0);
__decorate([
    Prop({ type: Object, default: {} }),
    __metadata("design:type", Object)
], User.prototype, "privacySettings", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Types.ObjectId)
], User.prototype, "avatarUploadId", void 0);
__decorate([
    Prop({ enum: ['active', 'deleting', 'deleted'], default: 'active' }),
    __metadata("design:type", String)
], User.prototype, "accountState", void 0);
User = __decorate([
    Schema({ timestamps: true, versionKey: false })
], User);
export { User };
export const UserSchema = SchemaFactory.createForClass(User);
let Session = class Session {
    _id;
    ownerId;
    familyId;
    tokenHash;
    expiresAt;
    revokedAt;
    replacedBy;
    userAgent;
    ipHash;
};
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", Types.ObjectId)
], Session.prototype, "ownerId", void 0);
__decorate([
    Prop({ required: true, unique: true }),
    __metadata("design:type", String)
], Session.prototype, "familyId", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], Session.prototype, "tokenHash", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Date)
], Session.prototype, "expiresAt", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Date)
], Session.prototype, "revokedAt", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Types.ObjectId)
], Session.prototype, "replacedBy", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Session.prototype, "userAgent", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Session.prototype, "ipHash", void 0);
Session = __decorate([
    Schema({ timestamps: true, versionKey: false })
], Session);
export { Session };
export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
let Goal = class Goal {
    _id;
    ownerId;
    title;
    notes;
    whyItMatters;
    deadlineType;
    deadlineDate;
    targetAge;
    preparationLeadDays;
    status;
    completedAt;
    reminder;
    milestones;
    deletedAt;
};
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", Types.ObjectId)
], Goal.prototype, "ownerId", void 0);
__decorate([
    Prop({ required: true, maxlength: 120 }),
    __metadata("design:type", String)
], Goal.prototype, "title", void 0);
__decorate([
    Prop({ maxlength: 2000 }),
    __metadata("design:type", String)
], Goal.prototype, "notes", void 0);
__decorate([
    Prop({ maxlength: 2000 }),
    __metadata("design:type", String)
], Goal.prototype, "whyItMatters", void 0);
__decorate([
    Prop({ enum: ['none', 'date', 'age'], default: 'none' }),
    __metadata("design:type", String)
], Goal.prototype, "deadlineType", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Goal.prototype, "deadlineDate", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Number)
], Goal.prototype, "targetAge", void 0);
__decorate([
    Prop({ min: 0 }),
    __metadata("design:type", Number)
], Goal.prototype, "preparationLeadDays", void 0);
__decorate([
    Prop({
        enum: ['active', 'completed', 'abandoned', 'archived'],
        default: 'active',
    }),
    __metadata("design:type", String)
], Goal.prototype, "status", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Date)
], Goal.prototype, "completedAt", void 0);
__decorate([
    Prop({ type: Object, default: { mode: 'default' } }),
    __metadata("design:type", Object)
], Goal.prototype, "reminder", void 0);
__decorate([
    Prop({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], Goal.prototype, "milestones", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Date)
], Goal.prototype, "deletedAt", void 0);
Goal = __decorate([
    Schema({ timestamps: true, versionKey: false })
], Goal);
export { Goal };
export const GoalSchema = SchemaFactory.createForClass(Goal);
GoalSchema.index({ ownerId: 1, deletedAt: 1, status: 1, createdAt: -1 });
let Timeline = class Timeline {
    _id;
    ownerId;
    goalId;
    eventType;
    occurredAt;
    note;
    snapshot;
    attachmentIds;
};
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", Types.ObjectId)
], Timeline.prototype, "ownerId", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Types.ObjectId)
], Timeline.prototype, "goalId", void 0);
__decorate([
    Prop({ required: true, enum: ['goal_created', 'goal_updated', 'goal_status', 'memory'] }),
    __metadata("design:type", String)
], Timeline.prototype, "eventType", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Date)
], Timeline.prototype, "occurredAt", void 0);
__decorate([
    Prop({ maxlength: 2000 }),
    __metadata("design:type", String)
], Timeline.prototype, "note", void 0);
__decorate([
    Prop({ type: Object, required: true }),
    __metadata("design:type", Object)
], Timeline.prototype, "snapshot", void 0);
__decorate([
    Prop({ type: [Types.ObjectId], default: [] }),
    __metadata("design:type", Array)
], Timeline.prototype, "attachmentIds", void 0);
Timeline = __decorate([
    Schema({ timestamps: true, versionKey: false })
], Timeline);
export { Timeline };
export const TimelineSchema = SchemaFactory.createForClass(Timeline);
TimelineSchema.index({ ownerId: 1, occurredAt: -1 });
let WhatIf = class WhatIf {
    _id;
    ownerId;
    title;
    description;
    attachmentIds;
};
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", Types.ObjectId)
], WhatIf.prototype, "ownerId", void 0);
__decorate([
    Prop({ required: true, maxlength: 120 }),
    __metadata("design:type", String)
], WhatIf.prototype, "title", void 0);
__decorate([
    Prop({ maxlength: 2000 }),
    __metadata("design:type", String)
], WhatIf.prototype, "description", void 0);
__decorate([
    Prop({ type: [Types.ObjectId], default: [] }),
    __metadata("design:type", Array)
], WhatIf.prototype, "attachmentIds", void 0);
WhatIf = __decorate([
    Schema({ timestamps: true, versionKey: false })
], WhatIf);
export { WhatIf };
export const WhatIfSchema = SchemaFactory.createForClass(WhatIf);
let Upload = class Upload {
    _id;
    ownerId;
    objectKey;
    contentType;
    byteSize;
    checksum;
    purpose;
    temporary;
    parentType;
    parentId;
    expiresAt;
};
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", Types.ObjectId)
], Upload.prototype, "ownerId", void 0);
__decorate([
    Prop({ required: true, unique: true }),
    __metadata("design:type", String)
], Upload.prototype, "objectKey", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], Upload.prototype, "contentType", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Number)
], Upload.prototype, "byteSize", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], Upload.prototype, "checksum", void 0);
__decorate([
    Prop({ required: true, enum: ['avatar', 'letter', 'memory', 'what-if'] }),
    __metadata("design:type", String)
], Upload.prototype, "purpose", void 0);
__decorate([
    Prop({ default: true }),
    __metadata("design:type", Boolean)
], Upload.prototype, "temporary", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Upload.prototype, "parentType", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Types.ObjectId)
], Upload.prototype, "parentId", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Date)
], Upload.prototype, "expiresAt", void 0);
Upload = __decorate([
    Schema({ timestamps: true, versionKey: false })
], Upload);
export { Upload };
export const UploadSchema = SchemaFactory.createForClass(Upload);
UploadSchema.index({ temporary: 1, expiresAt: 1 });
let Letter = class Letter {
    _id;
    ownerId;
    body;
    attachmentIds;
    deliveryType;
    deliveryDate;
    targetAge;
    scheduledAt;
    timeZone;
    emailEnabled;
    inAppEnabled;
    status;
    deliveredAt;
};
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", Types.ObjectId)
], Letter.prototype, "ownerId", void 0);
__decorate([
    Prop({ required: true, maxlength: 10000 }),
    __metadata("design:type", String)
], Letter.prototype, "body", void 0);
__decorate([
    Prop({ type: [Types.ObjectId], default: [] }),
    __metadata("design:type", Array)
], Letter.prototype, "attachmentIds", void 0);
__decorate([
    Prop({ required: true, enum: ['date', 'age'] }),
    __metadata("design:type", String)
], Letter.prototype, "deliveryType", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Letter.prototype, "deliveryDate", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Number)
], Letter.prototype, "targetAge", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Date)
], Letter.prototype, "scheduledAt", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], Letter.prototype, "timeZone", void 0);
__decorate([
    Prop({ default: true }),
    __metadata("design:type", Boolean)
], Letter.prototype, "emailEnabled", void 0);
__decorate([
    Prop({ default: true }),
    __metadata("design:type", Boolean)
], Letter.prototype, "inAppEnabled", void 0);
__decorate([
    Prop({ enum: ['scheduled', 'delivering', 'delivered', 'cancelled', 'failed'], default: 'scheduled' }),
    __metadata("design:type", String)
], Letter.prototype, "status", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Date)
], Letter.prototype, "deliveredAt", void 0);
Letter = __decorate([
    Schema({ timestamps: true, versionKey: false })
], Letter);
export { Letter };
export const LetterSchema = SchemaFactory.createForClass(Letter);
let Job = class Job {
    _id;
    ownerId;
    type;
    resourceId;
    idempotencyKey;
    runAt;
    status;
    attempts;
    maxAttempts;
    leaseUntil;
    workerId;
    lastErrorCode;
    result;
};
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", Types.ObjectId)
], Job.prototype, "ownerId", void 0);
__decorate([
    Prop({ required: true, enum: ['letter', 'reminder', 'cleanup', 'export'] }),
    __metadata("design:type", String)
], Job.prototype, "type", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Types.ObjectId)
], Job.prototype, "resourceId", void 0);
__decorate([
    Prop({ required: true, unique: true }),
    __metadata("design:type", String)
], Job.prototype, "idempotencyKey", void 0);
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", Date)
], Job.prototype, "runAt", void 0);
__decorate([
    Prop({ enum: ['pending', 'processing', 'completed', 'cancelled', 'failed'], default: 'pending' }),
    __metadata("design:type", String)
], Job.prototype, "status", void 0);
__decorate([
    Prop({ default: 0 }),
    __metadata("design:type", Number)
], Job.prototype, "attempts", void 0);
__decorate([
    Prop({ default: 5 }),
    __metadata("design:type", Number)
], Job.prototype, "maxAttempts", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Date)
], Job.prototype, "leaseUntil", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Job.prototype, "workerId", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Job.prototype, "lastErrorCode", void 0);
__decorate([
    Prop({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Job.prototype, "result", void 0);
Job = __decorate([
    Schema({ timestamps: true, versionKey: false })
], Job);
export { Job };
export const JobSchema = SchemaFactory.createForClass(Job);
JobSchema.index({ status: 1, runAt: 1, leaseUntil: 1 });
let AppUpdatePolicy = class AppUpdatePolicy {
    _id;
    platform;
    latestVersion;
    minimumVersion;
    minimumBuild;
    storeUrl;
    releaseNotes;
    enabled;
    policyVersion;
};
__decorate([
    Prop({ required: true, enum: ['android', 'ios'], unique: true }),
    __metadata("design:type", String)
], AppUpdatePolicy.prototype, "platform", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], AppUpdatePolicy.prototype, "latestVersion", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], AppUpdatePolicy.prototype, "minimumVersion", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Number)
], AppUpdatePolicy.prototype, "minimumBuild", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], AppUpdatePolicy.prototype, "storeUrl", void 0);
__decorate([
    Prop({ type: [String], default: [] }),
    __metadata("design:type", Array)
], AppUpdatePolicy.prototype, "releaseNotes", void 0);
__decorate([
    Prop({ default: true }),
    __metadata("design:type", Boolean)
], AppUpdatePolicy.prototype, "enabled", void 0);
__decorate([
    Prop({ default: 1 }),
    __metadata("design:type", Number)
], AppUpdatePolicy.prototype, "policyVersion", void 0);
AppUpdatePolicy = __decorate([
    Schema({ timestamps: true, versionKey: false })
], AppUpdatePolicy);
export { AppUpdatePolicy };
export const AppUpdatePolicySchema = SchemaFactory.createForClass(AppUpdatePolicy);
let Device = class Device {
    _id;
    ownerId;
    token;
    platform;
    enabled;
};
__decorate([
    Prop({ required: true, index: true }),
    __metadata("design:type", Types.ObjectId)
], Device.prototype, "ownerId", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], Device.prototype, "token", void 0);
__decorate([
    Prop({ required: true, enum: ['android', 'ios'] }),
    __metadata("design:type", String)
], Device.prototype, "platform", void 0);
__decorate([
    Prop({ default: true }),
    __metadata("design:type", Boolean)
], Device.prototype, "enabled", void 0);
Device = __decorate([
    Schema({ timestamps: true, versionKey: false })
], Device);
export { Device };
export const DeviceSchema = SchemaFactory.createForClass(Device);
DeviceSchema.index({ ownerId: 1, token: 1 }, { unique: true });
//# sourceMappingURL=schemas.js.map