import { jest } from '@jest/globals';
import { defaultReminder } from './planning/planning.module.js';

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
