import type { Goal } from '../api';
import { daysBetween, formatDateOnly, goalDeadline, localToday } from './dates';
import { t } from '../strings';

type DeadlineFields = Pick<Goal, 'deadlineType' | 'deadlineDate' | 'targetAge'>;

export function deadlineLabel(goal: DeadlineFields, birthDate?: string | null): string {
  const date = goalDeadline(goal, birthDate);
  if (goal.deadlineType === 'none') return t.goals.noDeadline;
  if (goal.deadlineType === 'age') {
    return date
      ? t.goals.atAgeWithDate(goal.targetAge ?? 0, formatDateOnly(date))
      : t.goals.atAge(goal.targetAge ?? 0);
  }
  return date ? t.goals.dueOn(formatDateOnly(date)) : t.goals.noDeadline;
}

/** True when an active goal's date has passed. Overdue goals stay valid. */
export function isPastDate(
  goal: Pick<Goal, 'status'> & DeadlineFields,
  birthDate?: string | null,
  today: string = localToday(),
): boolean {
  if (goal.status !== 'active') return false;
  const date = goalDeadline(goal, birthDate);
  if (!date) return false;
  const days = daysBetween(today, date);
  return days !== null && days < 0;
}

/** Whole days from today to the goal's date, or null with no deadline. */
export function daysUntilDeadline(
  goal: DeadlineFields,
  birthDate?: string | null,
  today: string = localToday(),
): number | null {
  const date = goalDeadline(goal, birthDate);
  return date ? daysBetween(today, date) : null;
}

export function statusLabel(status: Goal['status']): string {
  return t.goals.status[status];
}
