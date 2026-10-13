import { Model, Types } from 'mongoose';
import { type AuthUser } from '../common/api.js';
import { Goal, Timeline, WhatIf } from '../database/schemas.js';
export declare class PageDto {
    page: number;
    limit: number;
}
export declare class GoalDto {
    title: string;
    notes?: string;
    whyItMatters?: string;
    deadlineType: 'none' | 'date' | 'age';
    deadlineDate?: string;
    targetAge?: number;
    preparationLeadDays?: number;
    reminder?: Record<string, unknown>;
    milestones?: Record<string, unknown>[];
}
export declare class GoalStatusDto {
    status: string;
}
export declare class MemoryDto {
    goalId?: string;
    occurredAt: string;
    note?: string;
    attachmentIds?: string[];
}
export declare class WhatIfDto {
    title: string;
    description?: string;
    attachmentIds?: string[];
}
export declare function defaultReminder(deadline?: string): string;
export declare class PlanningService {
    private readonly goals;
    private readonly timeline;
    private readonly paths;
    constructor(goals: Model<Goal>, timeline: Model<Timeline>, paths: Model<WhatIf>);
    private event;
    createGoal(ownerId: string, dto: GoalDto): Promise<import("mongoose").Document<unknown, {}, Goal, {}, import("mongoose").DefaultSchemaOptions> & Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    goalsList(ownerId: string, page: number, limit: number): Promise<{
        items: (Goal & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    goal(ownerId: string, id: string): Promise<import("mongoose").Document<unknown, {}, Goal, {}, import("mongoose").DefaultSchemaOptions> & Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateGoal(ownerId: string, id: string, dto: GoalDto): Promise<import("mongoose").Document<unknown, {}, Goal, {}, import("mongoose").DefaultSchemaOptions> & Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    status(ownerId: string, id: string, status: string): Promise<import("mongoose").Document<unknown, {}, Goal, {}, import("mongoose").DefaultSchemaOptions> & Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    deleteGoal(ownerId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    createMemory(ownerId: string, dto: MemoryDto): Promise<import("mongoose").Document<unknown, {}, Timeline, {}, import("mongoose").DefaultSchemaOptions> & Timeline & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    timelineList(ownerId: string, page: number, limit: number): Promise<{
        items: (Timeline & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    removeMemory(ownerId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    createPath(ownerId: string, dto: WhatIfDto): Promise<import("mongoose").Document<unknown, {}, WhatIf, {}, import("mongoose").DefaultSchemaOptions> & WhatIf & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    pathsList(ownerId: string, page: number, limit: number): Promise<{
        items: (WhatIf & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    updatePath(ownerId: string, id: string, dto: WhatIfDto): Promise<import("mongoose").Document<unknown, {}, WhatIf, {}, import("mongoose").DefaultSchemaOptions> & WhatIf & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    removePath(ownerId: string, id: string): Promise<{
        deleted: boolean;
    }>;
}
export declare class GoalsController {
    private readonly planning;
    constructor(planning: PlanningService);
    create(u: AuthUser, dto: GoalDto): Promise<import("mongoose").Document<unknown, {}, Goal, {}, import("mongoose").DefaultSchemaOptions> & Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    list(u: AuthUser, q: PageDto): Promise<{
        items: (Goal & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    get(u: AuthUser, id: string): Promise<import("mongoose").Document<unknown, {}, Goal, {}, import("mongoose").DefaultSchemaOptions> & Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    update(u: AuthUser, id: string, dto: GoalDto): Promise<import("mongoose").Document<unknown, {}, Goal, {}, import("mongoose").DefaultSchemaOptions> & Goal & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    status(u: AuthUser, id: string, dto: GoalStatusDto): Promise<import("mongoose").Document<unknown, {}, Goal, {}, import("mongoose").DefaultSchemaOptions> & Goal & Required<{
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
export declare class TimelineController {
    private readonly planning;
    constructor(planning: PlanningService);
    list(u: AuthUser, q: PageDto): Promise<{
        items: (Timeline & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    create(u: AuthUser, dto: MemoryDto): Promise<import("mongoose").Document<unknown, {}, Timeline, {}, import("mongoose").DefaultSchemaOptions> & Timeline & Required<{
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
export declare class WhatIfController {
    private readonly planning;
    constructor(planning: PlanningService);
    create(u: AuthUser, dto: WhatIfDto): Promise<import("mongoose").Document<unknown, {}, WhatIf, {}, import("mongoose").DefaultSchemaOptions> & WhatIf & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    list(u: AuthUser, q: PageDto): Promise<{
        items: (WhatIf & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    update(u: AuthUser, id: string, dto: WhatIfDto): Promise<import("mongoose").Document<unknown, {}, WhatIf, {}, import("mongoose").DefaultSchemaOptions> & WhatIf & Required<{
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
export declare class PlanningModule {
}
