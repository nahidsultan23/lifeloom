// The one date helper. Rules:
// - Instants (ISO strings with a Z) display in a time zone.
// - Date-only values ("2030-05-17") are calendar dates. They are never put
//   through the device time zone, so they cannot move to another day.
// - Age math matches the server (luxon): a Feb 29 birthday falls on Feb 28
//   in years that have no Feb 29.

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseDateOnly(value: string | undefined | null): DateParts | null {
  const match = value ? DATE_ONLY.exec(value) : null;
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return { year, month, day };
}

export function isValidDateOnly(value: string | undefined | null): boolean {
  return parseDateOnly(value) !== null;
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

export function formatParts({ year, month, day }: DateParts): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/** Calendar date from the device's local clock. */
export function localToday(now: Date = new Date()): string {
  return formatParts({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
}

/** Turns a picker Date (local midnight-ish) into a date-only string. */
export function dateToDateOnly(date: Date): string {
  return localToday(date);
}

/** A local Date set to noon, so pickers never land on a neighbouring day. */
export function dateOnlyToPickerDate(value: string | undefined | null): Date {
  const parts = parseDateOnly(value);
  if (!parts) return new Date();
  return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0);
}

function utcDayNumber({ year, month, day }: DateParts): number {
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

/** Whole calendar days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number | null {
  const a = parseDateOnly(from);
  const b = parseDateOnly(to);
  if (!a || !b) return null;
  return utcDayNumber(b) - utcDayNumber(a);
}

export function formatDateOnly(
  value: string | undefined | null,
  locale?: string,
): string {
  const parts = parseDateOnly(value);
  if (!parts) return '';
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)));
}

export function formatInstant(
  iso: string | undefined | null,
  timeZone: string = deviceTimeZone(),
  locale?: string,
): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  } as const;
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
}

/** Calendar day of an instant in a time zone, as date-only. */
export function instantToDateOnly(
  iso: string,
  timeZone: string = deviceTimeZone(),
): string {
  const date = new Date(iso);
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return formatted;
}

/** Noon on a calendar date in the device zone, as a UTC instant. */
export function dateOnlyToInstant(value: string): string {
  return dateOnlyToPickerDate(value).toISOString();
}

export function addYears(value: string, years: number): string | null {
  const parts = parseDateOnly(value);
  if (!parts) return null;
  const year = parts.year + years;
  const day = Math.min(parts.day, daysInMonth(year, parts.month));
  return formatParts({ year, month: parts.month, day });
}

/** Age in whole years on `today`. */
export function ageOn(birthDate: string, today: string = localToday()): number | null {
  const birth = parseDateOnly(birthDate);
  const now = parseDateOnly(today);
  if (!birth || !now) return null;
  let age = now.year - birth.year;
  const birthdayThisYear = addYears(birthDate, age);
  if (birthdayThisYear && birthdayThisYear > today) age -= 1;
  return age < 0 ? null : age;
}

export interface GoalDeadlineInput {
  deadlineType?: string;
  deadlineDate?: string;
  targetAge?: number;
}

/** Calendar date a goal is aimed at, or null when it has no deadline. */
export function goalDeadline(
  goal: GoalDeadlineInput,
  birthDate?: string | null,
): string | null {
  if (goal.deadlineType === 'date') return goal.deadlineDate ?? null;
  if (goal.deadlineType === 'age' && goal.targetAge && birthDate) {
    return addYears(birthDate, goal.targetAge);
  }
  return null;
}

export type ReminderFrequency =
  | 'none'
  | 'daily'
  | 'every_2_days'
  | 'weekly'
  | 'every_14_days'
  | 'monthly';

/** Mirrors the server defaults. The saved value always comes from the server. */
export function defaultFrequency(daysUntilDeadline: number | null): ReminderFrequency {
  if (daysUntilDeadline === null) return 'none';
  if (daysUntilDeadline > 365) return 'monthly';
  if (daysUntilDeadline >= 90) return 'every_14_days';
  if (daysUntilDeadline >= 30) return 'weekly';
  if (daysUntilDeadline >= 7) return 'every_2_days';
  return 'daily';
}

/** Share of an expected lifespan that has passed, 0 to 1, or null. */
export function lifespanFraction(
  birthDate: string | undefined,
  years: number | undefined,
  today: string = localToday(),
): number | null {
  if (!birthDate || !years) return null;
  const end = addYears(birthDate, years);
  const total = end ? daysBetween(birthDate, end) : null;
  const passed = daysBetween(birthDate, today);
  if (!total || passed === null) return null;
  return Math.min(1, Math.max(0, passed / total));
}
