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
import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query, UnprocessableEntityException, UseGuards, } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsInt, IsMongoId, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf, } from 'class-validator';
import { DateTime } from 'luxon';
import { Model, Types } from 'mongoose';
import { CurrentUser } from '../common/api.js';
import { Goal, GoalSchema, Timeline, TimelineSchema, WhatIf, WhatIfSchema, } from '../database/schemas.js';
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
export class PageDto {
    page = 1;
    limit = 20;
}
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    __metadata("design:type", Object)
], PageDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    __metadata("design:type", Object)
], PageDto.prototype, "limit", void 0);
export class GoalDto {
    title;
    notes;
    whyItMatters;
    deadlineType = 'none';
    deadlineDate;
    targetAge;
    preparationLeadDays;
    reminder;
    milestones;
}
__decorate([
    ApiProperty({ maxLength: 120 }),
    IsString(),
    MaxLength(120),
    __metadata("design:type", String)
], GoalDto.prototype, "title", void 0);
__decorate([
    ApiPropertyOptional({ maxLength: 2000 }),
    IsOptional(),
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], GoalDto.prototype, "notes", void 0);
__decorate([
    ApiPropertyOptional({ maxLength: 2000 }),
    IsOptional(),
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], GoalDto.prototype, "whyItMatters", void 0);
__decorate([
    ApiProperty({ enum: ['none', 'date', 'age'], default: 'none' }),
    IsEnum(['none', 'date', 'age']),
    __metadata("design:type", String)
], GoalDto.prototype, "deadlineType", void 0);
__decorate([
    ValidateIf((o) => o.deadlineType === 'date'),
    Matches(DATE_ONLY),
    __metadata("design:type", String)
], GoalDto.prototype, "deadlineDate", void 0);
__decorate([
    ValidateIf((o) => o.deadlineType === 'age'),
    IsInt(),
    Min(1),
    Max(150),
    __metadata("design:type", Number)
], GoalDto.prototype, "targetAge", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    Max(36500),
    __metadata("design:type", Number)
], GoalDto.prototype, "preparationLeadDays", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], GoalDto.prototype, "reminder", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], GoalDto.prototype, "milestones", void 0);
export class GoalStatusDto {
    status;
}
__decorate([
    IsEnum(['active', 'completed', 'abandoned', 'archived']),
    __metadata("design:type", String)
], GoalStatusDto.prototype, "status", void 0);
export class MemoryDto {
    goalId;
    occurredAt;
    note;
    attachmentIds;
}
__decorate([
    IsOptional(),
    IsMongoId(),
    __metadata("design:type", String)
], MemoryDto.prototype, "goalId", void 0);
__decorate([
    IsDateString(),
    __metadata("design:type", String)
], MemoryDto.prototype, "occurredAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], MemoryDto.prototype, "note", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], MemoryDto.prototype, "attachmentIds", void 0);
export class WhatIfDto {
    title;
    description;
    attachmentIds;
}
__decorate([
    IsString(),
    MaxLength(120),
    __metadata("design:type", String)
], WhatIfDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], WhatIfDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], WhatIfDto.prototype, "attachmentIds", void 0);
export function defaultReminder(deadline) {
    if (!deadline)
        return 'none';
    const days = Math.ceil(DateTime.fromISO(deadline, { zone: 'utc' }).diffNow('days').days);
    if (days > 365)
        return 'monthly';
    if (days >= 90)
        return 'every_14_days';
    if (days >= 30)
        return 'weekly';
    if (days >= 7)
        return 'every_2_days';
    return 'daily';
}
let PlanningService = class PlanningService {
    goals;
    timeline;
    paths;
    constructor(goals, timeline, paths) {
        this.goals = goals;
        this.timeline = timeline;
        this.paths = paths;
    }
    async event(ownerId, goal, eventType) {
        await this.timeline.create({
            ownerId,
            goalId: goal._id,
            eventType,
            occurredAt: new Date(),
            snapshot: goal.toObject(),
        });
    }
    async createGoal(ownerId, dto) {
        if (dto.deadlineType === 'date' && !DateTime.fromISO(dto.deadlineDate).isValid) {
            throw new UnprocessableEntityException({
                code: 'VALIDATION_ERROR',
                message: 'Deadline must be a valid calendar date',
            });
        }
        const reminder = dto.reminder?.mode === 'override'
            ? dto.reminder
            : {
                mode: 'default',
                frequency: defaultReminder(dto.deadlineDate),
            };
        const goal = await this.goals.create({ ownerId, ...dto, reminder });
        await this.event(ownerId, goal, 'goal_created');
        return goal;
    }
    async goalsList(ownerId, page, limit) {
        const filter = { ownerId: new Types.ObjectId(ownerId), deletedAt: { $exists: false } };
        const [items, total] = await Promise.all([
            this.goals.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            this.goals.countDocuments(filter),
        ]);
        return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async goal(ownerId, id) {
        const goal = await this.goals.findOne({ _id: id, ownerId, deletedAt: { $exists: false } });
        if (!goal)
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Goal not found' });
        return goal;
    }
    async updateGoal(ownerId, id, dto) {
        const goal = await this.goals.findOneAndUpdate({ _id: id, ownerId, deletedAt: { $exists: false } }, { $set: dto }, { new: true, runValidators: true });
        if (!goal)
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Goal not found' });
        await this.event(ownerId, goal, 'goal_updated');
        return goal;
    }
    async status(ownerId, id, status) {
        const goal = await this.goals.findOneAndUpdate({ _id: id, ownerId, deletedAt: { $exists: false } }, {
            $set: {
                status,
                ...(status === 'completed' ? { completedAt: new Date() } : {}),
            },
            ...(status !== 'completed' ? { $unset: { completedAt: 1 } } : {}),
        }, { new: true });
        if (!goal)
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Goal not found' });
        await this.event(ownerId, goal, 'goal_status');
        return goal;
    }
    async deleteGoal(ownerId, id) {
        const goal = await this.goals.findOneAndUpdate({ _id: id, ownerId, deletedAt: { $exists: false } }, { $set: { deletedAt: new Date() } }, { new: true });
        if (!goal)
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Goal not found' });
        return { deleted: true };
    }
    async createMemory(ownerId, dto) {
        if (dto.goalId)
            await this.goal(ownerId, dto.goalId);
        return this.timeline.create({
            ownerId,
            goalId: dto.goalId,
            eventType: 'memory',
            occurredAt: new Date(dto.occurredAt),
            note: dto.note,
            attachmentIds: dto.attachmentIds ?? [],
            snapshot: { note: dto.note },
        });
    }
    async timelineList(ownerId, page, limit) {
        const filter = { ownerId: new Types.ObjectId(ownerId) };
        const [items, total] = await Promise.all([
            this.timeline.find(filter).sort({ occurredAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            this.timeline.countDocuments(filter),
        ]);
        return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async removeMemory(ownerId, id) {
        const result = await this.timeline.deleteOne({ _id: id, ownerId, eventType: 'memory' });
        if (!result.deletedCount)
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Memory not found' });
        return { deleted: true };
    }
    createPath(ownerId, dto) {
        return this.paths.create({ ownerId, ...dto });
    }
    async pathsList(ownerId, page, limit) {
        const filter = { ownerId: new Types.ObjectId(ownerId) };
        const [items, total] = await Promise.all([
            this.paths.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            this.paths.countDocuments(filter),
        ]);
        return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async updatePath(ownerId, id, dto) {
        const path = await this.paths.findOneAndUpdate({ _id: id, ownerId }, { $set: dto }, { new: true });
        if (!path)
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'What-if path not found' });
        return path;
    }
    async removePath(ownerId, id) {
        const result = await this.paths.deleteOne({ _id: id, ownerId });
        if (!result.deletedCount)
            throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'What-if path not found' });
        return { deleted: true };
    }
};
PlanningService = __decorate([
    Injectable(),
    __param(0, InjectModel(Goal.name)),
    __param(1, InjectModel(Timeline.name)),
    __param(2, InjectModel(WhatIf.name)),
    __metadata("design:paramtypes", [Model,
        Model,
        Model])
], PlanningService);
export { PlanningService };
let GoalsController = class GoalsController {
    planning;
    constructor(planning) {
        this.planning = planning;
    }
    create(u, dto) { return this.planning.createGoal(u.id, dto); }
    list(u, q) { return this.planning.goalsList(u.id, q.page, q.limit); }
    get(u, id) { return this.planning.goal(u.id, id); }
    update(u, id, dto) { return this.planning.updateGoal(u.id, id, dto); }
    status(u, id, dto) { return this.planning.status(u.id, id, dto.status); }
    remove(u, id) { return this.planning.deleteGoal(u.id, id); }
};
__decorate([
    Post(),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, GoalDto]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, PageDto]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "list", null);
__decorate([
    Get(':id'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "get", null);
__decorate([
    Patch(':id'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, GoalDto]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "update", null);
__decorate([
    Post(':id/status'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, GoalStatusDto]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "status", null);
__decorate([
    Delete(':id'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "remove", null);
GoalsController = __decorate([
    ApiTags('goals'),
    ApiBearerAuth(),
    UseGuards(AuthGuard('jwt')),
    Controller('goals'),
    __metadata("design:paramtypes", [PlanningService])
], GoalsController);
export { GoalsController };
let TimelineController = class TimelineController {
    planning;
    constructor(planning) {
        this.planning = planning;
    }
    list(u, q) { return this.planning.timelineList(u.id, q.page, q.limit); }
    create(u, dto) { return this.planning.createMemory(u.id, dto); }
    remove(u, id) { return this.planning.removeMemory(u.id, id); }
};
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, PageDto]),
    __metadata("design:returntype", void 0)
], TimelineController.prototype, "list", null);
__decorate([
    Post('memories'),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, MemoryDto]),
    __metadata("design:returntype", void 0)
], TimelineController.prototype, "create", null);
__decorate([
    Delete('memories/:id'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TimelineController.prototype, "remove", null);
TimelineController = __decorate([
    ApiTags('timeline'),
    ApiBearerAuth(),
    UseGuards(AuthGuard('jwt')),
    Controller('timeline'),
    __metadata("design:paramtypes", [PlanningService])
], TimelineController);
export { TimelineController };
let WhatIfController = class WhatIfController {
    planning;
    constructor(planning) {
        this.planning = planning;
    }
    create(u, dto) { return this.planning.createPath(u.id, dto); }
    list(u, q) { return this.planning.pathsList(u.id, q.page, q.limit); }
    update(u, id, dto) { return this.planning.updatePath(u.id, id, dto); }
    remove(u, id) { return this.planning.removePath(u.id, id); }
};
__decorate([
    Post(),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, WhatIfDto]),
    __metadata("design:returntype", void 0)
], WhatIfController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, PageDto]),
    __metadata("design:returntype", void 0)
], WhatIfController.prototype, "list", null);
__decorate([
    Patch(':id'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, WhatIfDto]),
    __metadata("design:returntype", void 0)
], WhatIfController.prototype, "update", null);
__decorate([
    Delete(':id'),
    __param(0, CurrentUser()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WhatIfController.prototype, "remove", null);
WhatIfController = __decorate([
    ApiTags('what-if'),
    ApiBearerAuth(),
    UseGuards(AuthGuard('jwt')),
    Controller('what-if-paths'),
    __metadata("design:paramtypes", [PlanningService])
], WhatIfController);
export { WhatIfController };
let PlanningModule = class PlanningModule {
};
PlanningModule = __decorate([
    Module({
        imports: [
            MongooseModule.forFeature([
                { name: Goal.name, schema: GoalSchema },
                { name: Timeline.name, schema: TimelineSchema },
                { name: WhatIf.name, schema: WhatIfSchema },
            ]),
        ],
        providers: [PlanningService],
        controllers: [GoalsController, TimelineController, WhatIfController],
        exports: [PlanningService],
    })
], PlanningModule);
export { PlanningModule };
//# sourceMappingURL=planning.module.js.map