import { ApiError } from '../src/api/client';
import { clearField, humanizeFieldErrors, toFormFailure } from '../src/lib/fieldErrors';

describe('field errors', () => {
  it('keeps the server path as the key and never shows the property name', () => {
    const result = humanizeFieldErrors({
      whyItMatters: 'must be shorter than or equal to 2000 characters',
      deadlineDate: 'must match /^\\d{4}-\\d{2}-\\d{2}$/ regular expression',
    });
    expect(result.whyItMatters).toBe('Why it matters must be shorter than or equal to 2000 characters');
    expect(result.deadlineDate).not.toMatch(/regular expression|\^/);
    for (const message of Object.values(result)) {
      expect(message).not.toMatch(/whyItMatters|deadlineDate/);
    }
  });

  it('maps nested milestone paths to the matching control key', () => {
    const result = humanizeFieldErrors({ 'milestones.0.title': 'must be shorter than or equal to 120 characters' });
    expect(Object.keys(result)).toEqual(['milestones.0.title']);
    expect(result['milestones.0.title']).toMatch(/^Milestone title must be shorter/);
  });

  it('leaves already readable messages alone', () => {
    expect(humanizeFieldErrors({ x: 'Enter a valid date.' }).x).toBe('Enter a valid date.');
  });

  it('turns an API error into a form failure that keeps the form message', () => {
    const error = new ApiError('http', 422, 'VALIDATION_ERROR', 'One or more fields are invalid', { title: 'must be a string' });
    const failure = toFormFailure(error);
    expect(failure.message).toBe('One or more fields are invalid');
    expect(failure.fields.title).toBe('Title must be a string');
    expect(failure.retryable).toBe(false);
  });

  it('marks network and server failures as retryable', () => {
    expect(toFormFailure(new ApiError('network', 0, 'NETWORK', 'x')).retryable).toBe(true);
    expect(toFormFailure(new ApiError('http', 500, 'INTERNAL_ERROR', 'x')).retryable).toBe(true);
    expect(toFormFailure(new Error('boom')).retryable).toBe(true);
  });

  it('clears one field without touching the others', () => {
    const errors = { a: '1', b: '2' };
    expect(clearField(errors, 'a')).toEqual({ b: '2' });
    expect(clearField(errors, 'missing')).toBe(errors);
  });
});
