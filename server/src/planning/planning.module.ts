import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import {
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { DateTime } from 'luxon';
import { Model, Types } from 'mongoose';
import { CurrentUser, type AuthUser } from '../common/api.js';
import {
  Goal,
  GoalSchema,
  Job,
  JobSchema,
  Timeline,
  TimelineSchema,
  User,
  UserSchema,
  WhatIf,
  WhatIfSchema,
  type Doc,
} from '../database/schemas.js';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class PageDto {
  @IsOptional() @IsInt() @Min(1) page = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}

export class GoalDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  title: string;
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  whyItMatters?: string;
  @ApiProperty({ enum: ['none', 'date', 'age'], default: 'none' })
  @IsEnum(['none', 'date', 'age'])
  deadlineType: 'none' | 'date' | 'age' = 'none';
  @ValidateIf((o: GoalDto) => o.deadlineType === 'date')
  @Matches(DATE_ONLY)
  deadlineDate?: string;
  @ValidateIf((o: GoalDto) => o.deadlineType === 'age')
  @IsInt()
  @Min(1)
  @Max(150)
  targetAge?: number;
  @IsOptional() @IsInt() @Min(0) @Max(36500) preparationLeadDays?: number;
  @IsOptional() @IsObject() reminder?: Record<string, unknown>;
  @IsOptional() @IsArray() milestones?: Record<string, unknown>[];
}

export class GoalStatusDto {
  @IsEnum(['active', 'completed', 'abandoned', 'archived'])
  status: string;
}

export class MemoryDto {
  @IsOptional() @IsMongoId() goalId?: string;
  @IsDateString() occurredAt: string;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}

export class WhatIfDto {
  @IsString() @MaxLength(120) title: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

export function defaultReminder(deadline?: string): string {
  if (!deadline) return 'none';
  const days = Math.ceil(
    DateTime.fromISO(deadline, { zone: 'utc' }).diffNow('days').days,
  );
  if (days > 365) return 'monthly';
  if (days >= 90) return 'every_14_days';
  if (days >= 30) return 'weekly';
  if (days >= 7) return 'every_2_days';
  return 'daily';
}

@Injectable()
export class PlanningService {
  constructor(
    @InjectModel(Goal.name) private readonly goals: Model<Goal>,
    @InjectModel(Timeline.name) private readonly timeline: Model<Timeline>,
    @InjectModel(WhatIf.name) private readonly paths: Model<WhatIf>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Job.name) private readonly jobs: Model<Job>,
  ) {}

  private async scheduleReminder(ownerId: string, goal: Doc<Goal>) {
    await this.jobs.updateMany(
      {
        ownerId,
        type: 'reminder',
        resourceId: goal._id,
        status: { $in: ['pending', 'processing'] },
      },
      { $set: { status: 'cancelled' } },
    );
    if (
      goal.deletedAt ||
      goal.status !== 'active' ||
      goal.deadlineType === 'none'
    )
      return;
    const user = await this.users.findById(ownerId).lean();
    let deadline: DateTime | null = null;
    if (goal.deadlineType === 'date' && goal.deadlineDate) {
      deadline = DateTime.fromISO(goal.deadlineDate, {
        zone: user?.timeZone ?? 'UTC',
      }).startOf('day');
    } else if (
      goal.deadlineType === 'age' &&
      goal.targetAge &&
      user?.birthDate
    ) {
      deadline = DateTime.fromISO(user.birthDate, {
        zone: user.timeZone,
      })
        .plus({ years: goal.targetAge })
        .startOf('day');
    }
    if (!deadline?.isValid) return;
    const reminder = goal.reminder as { frequency?: string; mode?: string };
    const frequency =
      reminder.frequency ?? defaultReminder(deadline.toISODate() ?? undefined);
    if (frequency === 'none' || reminder.mode === 'disabled') return;
    const daysByFrequency: Record<string, number> = {
      daily: 1,
      every_2_days: 2,
      weekly: 7,
      every_14_days: 14,
      monthly: 30,
    };
    const intervalDays = daysByFrequency[frequency];
    if (!intervalDays) return;
    const next = DateTime.min(
      deadline,
      DateTime.now()
        .setZone(user?.timeZone ?? 'UTC')
        .plus({
          days: intervalDays,
        }),
    );
    const idempotencyKey = `reminder:${goal._id.toString()}:${next.toUTC().toISO()}`;
    await this.jobs.findOneAndUpdate(
      { idempotencyKey },
      {
        $set: {
          ownerId,
          type: 'reminder',
          resourceId: goal._id,
          runAt: next.toUTC().toJSDate(),
          status: 'pending',
          result: { frequency, intervalDays },
        },
      },
      { upsert: true },
    );
  }

  private async event(
    ownerId: string,
    goal: Doc<Goal>,
    eventType: 'goal_created' | 'goal_updated' | 'goal_status',
  ) {
    await this.timeline.create({
      ownerId,
      goalId: goal._id,
      eventType,
      occurredAt: new Date(),
      snapshot: goal.toObject() as unknown as Record<string, unknown>,
    });
  }

  async createGoal(ownerId: string, dto: GoalDto) {
    if (
      dto.deadlineType === 'date' &&
      !DateTime.fromISO(dto.deadlineDate!).isValid
    ) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Deadline must be a valid calendar date',
      });
    }
    const reminder =
      dto.reminder?.mode === 'override'
        ? dto.reminder
        : {
            mode: 'default',
            frequency: defaultReminder(dto.deadlineDate),
          };
    const goal = await this.goals.create({ ownerId, ...dto, reminder });
    await this.event(ownerId, goal, 'goal_created');
    await this.scheduleReminder(ownerId, goal);
    return goal;
  }

  async goalsList(ownerId: string, page: number, limit: number) {
    const filter = {
      ownerId: new Types.ObjectId(ownerId),
      deletedAt: { $exists: false },
    };
    const [items, total] = await Promise.all([
      this.goals
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.goals.countDocuments(filter),
    ]);
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async goal(ownerId: string, id: string) {
    const goal = await this.goals.findOne({
      _id: id,
      ownerId,
      deletedAt: { $exists: false },
    });
    if (!goal)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Goal not found',
      });
    return goal;
  }

  async updateGoal(ownerId: string, id: string, dto: GoalDto) {
    const goal = await this.goals.findOneAndUpdate(
      { _id: id, ownerId, deletedAt: { $exists: false } },
      { $set: dto },
      { new: true, runValidators: true },
    );
    if (!goal)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Goal not found',
      });
    await this.event(ownerId, goal, 'goal_updated');
    await this.scheduleReminder(ownerId, goal);
    return goal;
  }

  async status(ownerId: string, id: string, status: string) {
    const goal = await this.goals.findOneAndUpdate(
      { _id: id, ownerId, deletedAt: { $exists: false } },
      {
        $set: {
          status,
          ...(status === 'completed' ? { completedAt: new Date() } : {}),
        },
        ...(status !== 'completed' ? { $unset: { completedAt: 1 } } : {}),
      },
      { new: true },
    );
    if (!goal)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Goal not found',
      });
    await this.event(ownerId, goal, 'goal_status');
    await this.scheduleReminder(ownerId, goal);
    return goal;
  }

  async deleteGoal(ownerId: string, id: string) {
    const goal = await this.goals.findOneAndUpdate(
      { _id: id, ownerId, deletedAt: { $exists: false } },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!goal)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Goal not found',
      });
    await this.scheduleReminder(ownerId, goal);
    return { deleted: true };
  }

  async createMemory(ownerId: string, dto: MemoryDto) {
    if (dto.goalId) await this.goal(ownerId, dto.goalId);
    return this.timeline.create({
      ownerId,
      goalId: dto.goalId,
      eventType: 'memory',
      occurredAt: new Date(dto.occurredAt),
      note: dto.note,
      attachmentIds: [],
      snapshot: { note: dto.note },
    });
  }

  async timelineList(ownerId: string, page: number, limit: number) {
    const filter = { ownerId: new Types.ObjectId(ownerId) };
    const [items, total] = await Promise.all([
      this.timeline
        .find(filter)
        .sort({ occurredAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.timeline.countDocuments(filter),
    ]);
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async removeMemory(ownerId: string, id: string) {
    const result = await this.timeline.deleteOne({
      _id: id,
      ownerId,
      eventType: 'memory',
    });
    if (!result.deletedCount)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Memory not found',
      });
    return { deleted: true };
  }

  createPath(ownerId: string, dto: WhatIfDto) {
    return this.paths.create({ ownerId, ...dto });
  }

  async pathsList(ownerId: string, page: number, limit: number) {
    const filter = { ownerId: new Types.ObjectId(ownerId) };
    const [items, total] = await Promise.all([
      this.paths
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.paths.countDocuments(filter),
    ]);
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updatePath(ownerId: string, id: string, dto: WhatIfDto) {
    const path = await this.paths.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: dto },
      { new: true },
    );
    if (!path)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'What-if path not found',
      });
    return path;
  }

  async removePath(ownerId: string, id: string) {
    const result = await this.paths.deleteOne({ _id: id, ownerId });
    if (!result.deletedCount)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'What-if path not found',
      });
    return { deleted: true };
  }
}

@ApiTags('goals')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('goals')
export class GoalsController {
  constructor(private readonly planning: PlanningService) {}
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: GoalDto) {
    return this.planning.createGoal(u.id, dto);
  }
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: PageDto) {
    return this.planning.goalsList(u.id, q.page, q.limit);
  }
  @Get(':id') get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.planning.goal(u.id, id);
  }
  @Patch(':id') update(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() dto: GoalDto,
  ) {
    return this.planning.updateGoal(u.id, id, dto);
  }
  @Post(':id/status') status(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() dto: GoalStatusDto,
  ) {
    return this.planning.status(u.id, id, dto.status);
  }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.planning.deleteGoal(u.id, id);
  }
}

@ApiTags('timeline')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('timeline')
export class TimelineController {
  constructor(private readonly planning: PlanningService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: PageDto) {
    return this.planning.timelineList(u.id, q.page, q.limit);
  }
  @Post('memories') create(@CurrentUser() u: AuthUser, @Body() dto: MemoryDto) {
    return this.planning.createMemory(u.id, dto);
  }
  @Delete('memories/:id') remove(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
  ) {
    return this.planning.removeMemory(u.id, id);
  }
}

@ApiTags('what-if')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('what-if-paths')
export class WhatIfController {
  constructor(private readonly planning: PlanningService) {}
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: WhatIfDto) {
    return this.planning.createPath(u.id, dto);
  }
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: PageDto) {
    return this.planning.pathsList(u.id, q.page, q.limit);
  }
  @Patch(':id') update(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() dto: WhatIfDto,
  ) {
    return this.planning.updatePath(u.id, id, dto);
  }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.planning.removePath(u.id, id);
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Goal.name, schema: GoalSchema },
      { name: Timeline.name, schema: TimelineSchema },
      { name: WhatIf.name, schema: WhatIfSchema },
      { name: User.name, schema: UserSchema },
      { name: Job.name, schema: JobSchema },
    ]),
  ],
  providers: [PlanningService],
  controllers: [GoalsController, TimelineController, WhatIfController],
  exports: [PlanningService],
})
export class PlanningModule {}
