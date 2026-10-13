import {
  addYears,
  ageOn,
  dateOnlyToInstant,
  daysBetween,
  defaultFrequency,
  formatDateOnly,
  formatInstant,
  goalDeadline,
  instantToDateOnly,
  isValidDateOnly,
  lifespanFraction,
  localToday,
  parseDateOnly,
} from '../src/lib/dates';

describe('date-only values', () => {
  it('parses and rejects impossible dates', () => {
    expect(parseDateOnly('2030-05-17')).toEqual({ year: 2030, month: 5, day: 17 });
    expect(isValidDateOnly('2030-02-30')).toBe(false);
    expect(isValidDateOnly('2024-02-29')).toBe(true);
    expect(isValidDateOnly('2023-02-29')).toBe(false);
    expect(isValidDateOnly('17/05/2030')).toBe(false);
    expect(isValidDateOnly('')).toBe(false);
  });

  it('shows the same calendar day whatever the device zone is', () => {
    // formatDateOnly pins UTC internally, so the text never depends on the zone.
    const text = formatDateOnly('2030-05-17', 'en-US');
    expect(text).toBe('May 17, 2030');
    expect(formatDateOnly('2030-01-01', 'en-US')).toBe('January 1, 2030');
    expect(formatDateOnly('2030-12-31', 'en-US')).toBe('December 31, 2030');
  });

  it('builds local-today from local parts, not UTC', () => {
    expect(localToday(new Date(2031, 0, 1, 0, 30))).toBe('2031-01-01');
    expect(localToday(new Date(2031, 11, 31, 23, 59))).toBe('2031-12-31');
  });

  it('counts calendar days without drifting over month ends', () => {
    expect(daysBetween('2030-01-31', '2030-02-01')).toBe(1);
    expect(daysBetween('2030-03-01', '2030-02-28')).toBe(-1);
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });

  it('keeps a picked day when turned into an instant and back in the device zone', () => {
    const instant = dateOnlyToInstant('2030-05-17');
    expect(instantToDateOnly(instant)).toBe('2030-05-17');
  });
});

describe('instants', () => {
  it('formats in the zone it is given', () => {
    const iso = '2030-05-17T23:30:00.000Z';
    expect(formatInstant(iso, 'Asia/Dhaka', 'en-US')).toContain('May 18, 2030');
    expect(formatInstant(iso, 'America/Los_Angeles', 'en-US')).toContain('May 17, 2030');
  });

  it('returns empty text for bad input', () => {
    expect(formatInstant('nope')).toBe('');
    expect(formatInstant(undefined)).toBe('');
  });
});

describe('age and leap days', () => {
  it('moves a Feb 29 birthday to Feb 28 in years without a Feb 29', () => {
    expect(addYears('2000-02-29', 1)).toBe('2001-02-28');
    expect(addYears('2000-02-29', 4)).toBe('2004-02-29');
    expect(addYears('2000-02-29', 100)).toBe('2100-02-28');
  });

  it('computes age on and around a birthday', () => {
    expect(ageOn('1994-06-21', '2024-06-20')).toBe(29);
    expect(ageOn('1994-06-21', '2024-06-21')).toBe(30);
    expect(ageOn('2000-02-29', '2023-02-27')).toBe(22);
    expect(ageOn('2000-02-29', '2023-02-28')).toBe(23);
  });

  it('finds the date for an age goal and ignores it without a birth date', () => {
    expect(goalDeadline({ deadlineType: 'age', targetAge: 40 }, '1994-06-21')).toBe('2034-06-21');
    expect(goalDeadline({ deadlineType: 'age', targetAge: 40 }, undefined)).toBeNull();
    expect(goalDeadline({ deadlineType: 'date', deadlineDate: '2030-01-01' })).toBe('2030-01-01');
    expect(goalDeadline({ deadlineType: 'none' })).toBeNull();
  });
});

describe('default reminder frequency', () => {
  it.each([
    [null, 'none'],
    [400, 'monthly'],
    [366, 'monthly'],
    [365, 'every_14_days'],
    [90, 'every_14_days'],
    [89, 'weekly'],
    [30, 'weekly'],
    [29, 'every_2_days'],
    [7, 'every_2_days'],
    [6, 'daily'],
    [0, 'daily'],
    [-5, 'daily'],
  ])('%s days -> %s', (days, expected) => {
    expect(defaultFrequency(days as number | null)).toBe(expected);
  });
});

describe('lifespan fraction', () => {
  it('is null unless both values are set', () => {
    expect(lifespanFraction(undefined, 80, '2024-01-01')).toBeNull();
    expect(lifespanFraction('1994-06-21', undefined, '2024-01-01')).toBeNull();
  });

  it('is between 0 and 1', () => {
    const value = lifespanFraction('1994-06-21', 80, '2024-06-21');
    expect(value).toBeGreaterThan(0.37);
    expect(value).toBeLessThan(0.38);
    expect(lifespanFraction('1994-06-21', 80, '2200-01-01')).toBe(1);
  });
});
