import { useState } from 'react';
import { api } from '../api';
import { DateField } from '../components/molecules/DateField';
import { TextField } from '../components/molecules/TextField';
import { Notice } from '../components/molecules/Notice';
import { FormTemplate } from '../components/templates/FormTemplate';
import { dateOnlyToInstant, isValidDateOnly, localToday } from '../lib/dates';
import { clearField, toFormFailure } from '../lib/fieldErrors';
import { LIMITS } from '../lib/limits';
import type { ScreenProps } from '../navigation/types';
import { t } from '../strings';

export function MemoryFormScreen({ route, navigation }: ScreenProps<'MemoryForm'>) {
  const goalId = route.params?.goalId;
  const [date, setDate] = useState(localToday());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const local: Record<string, string> = {};
    if (!isValidDateOnly(date)) local.occurredAt = t.ledger.errors.dateRequired;
    if (!note.trim()) local.note = t.ledger.errors.noteRequired;
    if (Object.keys(local).length) {
      setErrors(local);
      setFormError(t.common.checkHighlighted);
      return;
    }
    setSubmitting(true);
    setErrors({});
    setFormError(undefined);
    try {
      const created = await api.timeline.createMemory({
        ...(goalId ? { goalId } : {}),
        occurredAt: dateOnlyToInstant(date),
        note: note.trim(),
      });
      // The next screen is where photos and audio are added.
      navigation.replace('Snapshot', { eventId: created._id });
    } catch (e) {
      const failure = toFormFailure(e);
      setErrors(failure.fields);
      setFormError(failure.message);
      setSubmitting(false);
    }
  };

  return (
    <FormTemplate submitLabel={t.ledger.saveMemory} submitting={submitting} onSubmit={submit} error={formError}>
      <Notice icon="info" message={t.ledger.attachAfterSave} />
      <DateField
        label={t.ledger.fields.date}
        value={date}
        maximumDate={new Date()}
        onChange={(v) => {
          setDate(v);
          setErrors((e) => clearField(e, 'occurredAt'));
        }}
        error={errors.occurredAt}
      />
      <TextField
        label={t.ledger.fields.note}
        value={note}
        onChangeText={(v) => {
          setNote(v);
          setErrors((e) => clearField(e, 'note'));
        }}
        maxLength={LIMITS.timelineNote}
        multiline
        error={errors.note}
      />
    </FormTemplate>
  );
}
