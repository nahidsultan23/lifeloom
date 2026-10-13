import { ApiError } from '../api/client';
import { t } from '../strings';

/** "milestones.0.title" -> "milestones.title" so labels do not depend on the index. */
function labelKey(path: string): string {
  return path
    .split('.')
    .filter((part) => !/^\d+$/.test(part))
    .join('.');
}

/**
 * Turns the server's field errors into messages a person can read, keyed by the
 * same path the server used. Never shows a raw property name.
 */
export function humanizeFieldErrors(
  fieldErrors: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [path, raw] of Object.entries(fieldErrors)) {
    const label = (t.fieldLabels as Record<string, string>)[labelKey(path)];
    let message = raw.trim();
    if (/regular expression|must match/i.test(message)) {
      message = t.errors.invalidFormat;
    } else if (label && /^must\b/i.test(message)) {
      message = `${label} ${message}`;
    }
    result[path] = message.charAt(0).toUpperCase() + message.slice(1);
  }
  return result;
}

export interface FormFailure {
  /** Message for the form as a whole. */
  message: string;
  fields: Record<string, string>;
  /** True when the user can simply try again. */
  retryable: boolean;
}

export function toFormFailure(error: unknown): FormFailure {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      fields: humanizeFieldErrors(error.fieldErrors),
      retryable: error.isOffline || error.status >= 500 || error.status === 429,
    };
  }
  return { message: t.errors.generic, fields: {}, retryable: true };
}

export function clearField(
  errors: Record<string, string>,
  path: string,
): Record<string, string> {
  if (!(path in errors)) return errors;
  const next = { ...errors };
  delete next[path];
  return next;
}
