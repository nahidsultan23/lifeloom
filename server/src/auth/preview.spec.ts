import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types, type Model } from 'mongoose';
import {
  GoalSchema,
  LetterSchema,
  TimelineSchema,
  WhatIfSchema,
  type Goal,
  type Letter,
  type Timeline,
  type WhatIf,
} from '../database/schemas.js';
import {
  PREVIEW_EMAIL,
  PreviewSignInDto,
  previewLoginAllowed,
  previewUserFields,
  seedPreview,
} from './preview.js';

function model<T>(name: string, schema: mongoose.Schema): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}

describe('preview login', () => {
  it('is limited to non-production environments', () => {
    expect(previewLoginAllowed('development')).toBe(true);
    expect(previewLoginAllowed('staging')).toBe(true);
    expect(previewLoginAllowed('test')).toBe(true);
    expect(previewLoginAllowed('production')).toBe(false);
    expect(previewLoginAllowed(undefined)).toBe(false);
  });

  it('uses one fixed account and ignores any client identity', () => {
    expect(previewUserFields().email).toBe(PREVIEW_EMAIL);
    expect(previewUserFields().email).toBe('test@gmail.com');
    expect(previewUserFields()).not.toHaveProperty('idToken');
  });

  it('rejects an email in the body', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    await expect(
      pipe.transform(
        { email: 'someone@else.com' },
        { type: 'body', metatype: PreviewSignInDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('sample data', () => {
    let mongo: MongoMemoryServer;

    beforeAll(async () => {
      mongo = await MongoMemoryServer.create();
      await mongoose.connect(mongo.getUri(), { dbName: 'lifeloom-preview-test' });
    }, 120000);

    afterAll(async () => {
      await mongoose.disconnect();
      await mongo.stop();
    });

    it('seeds once', async () => {
      const ownerId = new Types.ObjectId();
      const models = {
        goals: model<Goal>('Goal', GoalSchema),
        timeline: model<Timeline>('Timeline', TimelineSchema),
        paths: model<WhatIf>('WhatIf', WhatIfSchema),
        letters: model<Letter>('Letter', LetterSchema),
      };
      await seedPreview(ownerId, models);
      await seedPreview(ownerId, models);
      expect(await models.goals.countDocuments({ ownerId })).toBe(3);
      expect(await models.timeline.countDocuments({ ownerId })).toBe(1);
      expect(await models.paths.countDocuments({ ownerId })).toBe(1);
      expect(await models.letters.countDocuments({ ownerId })).toBe(1);
    });
  });
});
