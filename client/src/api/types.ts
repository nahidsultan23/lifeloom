// Typed models for the Lifeloom REST API. Source of truth: the server's
// controllers and DTOs under server/src. Ids are Mongo ObjectId strings and
// arrive as `_id` on stored documents.

export interface Envelope<T> {
  success: true;
  data: T;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    /** Path to message, e.g. { "deadlineDate": "must match ..." } */
    fieldErrors: Record<string, string>;
    requestId?: string;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Page<T> {
  items: T[];
  pagination: Pagination;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  birthDate?: string;
  expectedLifespanYears?: number;
  timeZone: string;
  locale?: string;
}

export interface SignInResult extends TokenPair {
  user: SessionUser;
}

/** Free-form on the server. These are the keys this client reads and writes. */
export interface NotificationPreferences {
  remindersEnabled?: boolean;
  lettersInApp?: boolean;
  [key: string]: unknown;
}

export interface Profile {
  _id: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  birthDate?: string;
  expectedLifespanYears?: number;
  timeZone: string;
  locale?: string;
  notificationPreferences: NotificationPreferences;
  avatarUploadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdate {
  displayName?: string;
  birthDate?: string;
  expectedLifespanYears?: number | null;
  timeZone?: string;
  locale?: string;
  notificationPreferences?: NotificationPreferences;
}

export type DeadlineType = 'none' | 'date' | 'age';
export type GoalStatus = 'active' | 'completed' | 'abandoned' | 'archived';
export type ReminderMode = 'default' | 'override';

export interface GoalReminder {
  mode?: ReminderMode;
  frequency?: string;
}

export interface Goal {
  _id: string;
  title: string;
  notes?: string;
  whyItMatters?: string;
  deadlineType: DeadlineType;
  deadlineDate?: string;
  targetAge?: number;
  preparationLeadDays?: number;
  status: GoalStatus;
  completedAt?: string;
  reminder: GoalReminder;
  createdAt: string;
  updatedAt: string;
}

/** PATCH /goals/:id replaces these fields, so edits send the whole set. */
export interface GoalInput {
  title: string;
  notes?: string;
  whyItMatters?: string;
  deadlineType: DeadlineType;
  deadlineDate?: string;
  targetAge?: number;
  reminder?: GoalReminder;
}

export type TimelineEventType =
  | 'goal_created'
  | 'goal_updated'
  | 'goal_status'
  | 'memory';

export interface TimelineEvent {
  _id: string;
  goalId?: string;
  eventType: TimelineEventType;
  occurredAt: string;
  note?: string;
  /** Stored at the time of the event. Never rebuilt from the current goal. */
  snapshot: Partial<Goal> & { note?: string };
  attachmentIds: string[];
}

export interface MemoryInput {
  goalId?: string;
  occurredAt: string;
  note?: string;
}

export interface WhatIfPath {
  _id: string;
  title: string;
  description?: string;
  attachmentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatIfInput {
  title: string;
  description?: string;
}

export type LetterStatus =
  | 'scheduled'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export interface Letter {
  _id: string;
  body: string;
  attachmentIds: string[];
  deliveryType: 'date' | 'age';
  deliveryDate?: string;
  targetAge?: number;
  scheduledAt: string;
  timeZone: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  status: LetterStatus;
  deliveredAt?: string;
  createdAt: string;
}

export interface LetterInput {
  body: string;
  deliveryType: 'date' | 'age';
  deliveryDate?: string;
  targetAge?: number;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

export type UploadKind = 'avatar' | 'letter' | 'memory' | 'what-if';

export interface UploadRecord {
  _id: string;
  contentType: string;
  byteSize: number;
  purpose: UploadKind;
  temporary: boolean;
}

export interface UploadAccess {
  url: string;
  expiresIn: number;
}

export interface ExportResult {
  url: string;
  expiresIn: number;
  format: 'zip';
  includesFiles: boolean;
  manifest: string;
}

export interface DeleteAccountResult {
  deleted: boolean;
  backupNotice: string;
}

export interface UpdatePolicy {
  latestVersion: string;
  minimumVersion: string;
  minimumBuild?: number;
  storeUrl: string;
  releaseNotes: string[];
  policyVersion: number;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  required: boolean;
  policy: UpdatePolicy | null;
}
