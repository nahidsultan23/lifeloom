import { jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { envSchema } from './config/env.js';
import { defaultReminder } from './planning/planning.module.js';
import { AppUpdatesService } from './privacy/privacy.module.js';
import { frameImage } from './uploads/uploads.module.js';

describe('reminder defaults', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => jest.useRealTimers());

  it.each([
    [undefined, 'none'],
    ['2027-02-01', 'monthly'],
    ['2026-06-01', 'every_14_days'],
    ['2026-03-01', 'weekly'],
    ['2026-01-15', 'every_2_days'],
    ['2026-01-04', 'daily'],
    ['2025-12-01', 'daily'],
  ])('maps %s to %s', (deadline, expected) => {
    expect(defaultReminder(deadline)).toBe(expected);
  });
});

describe('configuration', () => {
  it('fails closed when required secrets are missing', () => {
    const result = envSchema.validate({
      APP_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost/lifeloom',
    });
    expect(result.error).toBeDefined();
  });
});

describe('app update policy', () => {
  const policy = {
    latestVersion: '2.0.0',
    minimumVersion: '1.5.0',
    minimumBuild: 10,
    storeUrl: 'https://example.test/store',
    releaseNotes: ['Update available'],
    policyVersion: 2,
  };
  const model = {
    findOne: jest.fn(() => ({ lean: () => Promise.resolve(policy) })),
  };
  const config = {
    get: jest.fn((key: string, fallback?: unknown) => {
      const values: Record<string, unknown> = {
        APP_UPDATE_CHECK_ENABLED: true,
        ANDROID_PACKAGE_ID: 'app.lifeloom',
      };
      return values[key] ?? fallback;
    }),
  };
  const service = new AppUpdatesService(
    model as never,
    config as unknown as ConfigService,
  );

  it('requires an update below the minimum SemVer', async () => {
    const result = await service.check({
      platform: 'android',
      version: '1.4.9',
      build: 99,
      appIdentifier: 'app.lifeloom',
    });
    expect(result.required).toBe(true);
  });

  it('uses the build floor at the minimum version', async () => {
    const result = await service.check({
      platform: 'android',
      version: '1.5.0',
      build: 9,
      appIdentifier: 'app.lifeloom',
    });
    expect(result.required).toBe(true);
  });
});

describe('photo framing', () => {
  it('contains a wide image in a 4:3 frame with equal surface padding', async () => {
    const source = await sharp({
      create: {
        width: 200,
        height: 100,
        channels: 3,
        background: '#cc0000',
      },
    })
      .png()
      .toBuffer();
    const framed = await frameImage(source, 'memory');
    const { data, info } = await sharp(framed)
      .raw()
      .toBuffer({ resolveWithObject: true });

    expect([info.width, info.height]).toEqual([1440, 1080]);
    const pixel = (x: number, y: number) => {
      const start = (y * info.width + x) * info.channels;
      return [...data.subarray(start, start + 3)];
    };
    const top = pixel(720, 40);
    const bottom = pixel(720, 1040);
    top.forEach((channel, index) =>
      expect(Math.abs(channel - bottom[index])).toBeLessThanOrEqual(2),
    );
    expect(pixel(720, 540)[0]).toBeGreaterThan(180);
  });
});
