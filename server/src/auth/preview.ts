import type { Model, Types } from 'mongoose';
import type { Goal, Letter, Timeline, WhatIf } from '../database/schemas.js';

/** Server-owned fixture. The client never sends an email or user id. */
export const PREVIEW_SUBJECT = 'preview:test@gmail.com';
export const PREVIEW_EMAIL = 'test@gmail.com';

export function previewLoginAllowed(env: string | undefined): boolean {
  return env === 'development' || env === 'staging' || env === 'test';
}

export function previewUserFields() {
  return {
    googleSubject: PREVIEW_SUBJECT,
    email: PREVIEW_EMAIL,
    emailVerified: true,
    displayName: 'Test',
    birthDate: '1990-04-12',
    expectedLifespanYears: 80,
    timeZone: 'UTC',
    accountState: 'active',
  };
}

/** No fields. An email or id in the body is rejected. */
export class PreviewSignInDto {}

/** Sample records so the signed-in screens have something to show. Once only. */
export async function seedPreview(
  ownerId: Types.ObjectId,
  models: {
    goals: Model<Goal>;
    timeline: Model<Timeline>;
    paths: Model<WhatIf>;
    letters: Model<Letter>;
  },
) {
  if ((await models.goals.countDocuments({ ownerId })) > 0) return;
  const [, garden] = await models.goals.create([
    {
      ownerId,
      title: 'Learn a song on the piano',
      whyItMatters: 'A small piece of music to come back to.',
      deadlineType: 'date',
      deadlineDate: '2027-06-01',
      status: 'active',
      reminder: { mode: 'default', frequency: 'monthly' },
    },
    {
      ownerId,
      title: 'Keep a small garden',
      notes: 'Herbs on the windowsill are enough.',
      deadlineType: 'none',
      status: 'active',
      reminder: { mode: 'default', frequency: 'none' },
    },
    {
      ownerId,
      title: 'Visit a city you like',
      deadlineType: 'none',
      status: 'completed',
      completedAt: new Date('2025-08-01T00:00:00.000Z'),
      reminder: { mode: 'default', frequency: 'none' },
    },
  ]);
  await models.timeline.create({
    ownerId,
    goalId: garden._id,
    eventType: 'memory',
    occurredAt: new Date('2025-11-02T00:00:00.000Z'),
    note: 'A quiet afternoon with the garden.',
    snapshot: { note: 'A quiet afternoon with the garden.' },
  });
  await models.paths.create({
    ownerId,
    title: 'Living closer to family',
    description: 'A path where Sundays are nearby.',
  });
  await models.letters.create({
    ownerId,
    body: 'Hello from today. I hope you are being kind to yourself.',
    deliveryType: 'date',
    deliveryDate: '2028-01-01',
    scheduledAt: new Date('2028-01-01T00:00:00.000Z'),
    timeZone: 'UTC',
    emailEnabled: false,
    inAppEnabled: true,
    status: 'scheduled',
  });
}
