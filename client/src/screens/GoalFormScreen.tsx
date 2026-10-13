import { useState } from 'react';
import { api, type DeadlineType, type Goal, type GoalInput, type GoalReminder } from '../api';
import { Button } from '../components/atoms/Button';
import { ChoiceRow } from '../components/molecules/ChoiceRow';
import { DateField } from '../components/molecules/DateField';
import { Notice } from '../components/molecules/Notice';
import { TextField } from '../components/molecules/TextField';
import { ReminderPicker } from '../components/organisms/ReminderPicker';
import { FormTemplate } from '../components/templates/FormTemplate';
import { ResourceView, ScreenTemplate } from '../components/templates/ScreenTemplate';
import { addYears, daysBetween, isValidDateOnly, localToday } from '../lib/dates';
import { clearField, toFormFailure } from '../lib/fieldErrors';
import { LIMITS } from '../lib/limits';
import type { ScreenProps } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useResource } from '../state/useResource';
import { t } from '../strings';

interface Values {
  title: string;
  notes: string;
  whyItMatters: string;
  deadlineType: DeadlineType;
  deadlineDate: string;
  targetAge: string;
  reminder: GoalReminder;
}

function initialValues(goal?: Goal): Values {
  return {
    title: goal?.title ?? '',
    notes: goal?.notes ?? '',
    whyItMatters: goal?.whyItMatters ?? '',
    deadlineType: goal?.deadlineType ?? 'none',
    deadlineDate: goal?.deadlineDate ?? '',
    targetAge: goal?.targetAge ? String(goal.targetAge) : '',
    reminder: goal?.reminder?.mode === 'override' ? goal.reminder : { mode: 'default' },
  };
}

export function validateGoal(v: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!v.title.trim()) errors.title = t.goals.errors.titleRequired;
  if (v.deadlineType === 'date' && !isValidDateOnly(v.deadlineDate)) {
    errors.deadlineDate = t.goals.errors.dateRequired;
  }
  if (v.deadlineType === 'age') {
    const age = Number(v.targetAge);
    if (!Number.isInteger(age) || age < 1 || age > LIMITS.targetAgeMax) {
      errors.targetAge = t.goals.errors.ageRange(LIMITS.targetAgeMax);
    }
  }
  return errors;
}

export function toGoalInput(v: Values): GoalInput {
  const input: GoalInput = {
    title: v.title.trim(),
    deadlineType: v.deadlineType,
    reminder: v.reminder,
  };
  // Empty text is sent as an empty string so an edit can clear a field.
  input.notes = v.notes.trim();
  input.whyItMatters = v.whyItMatters.trim();
  if (v.deadlineType === 'date') input.deadlineDate = v.deadlineDate;
  if (v.deadlineType === 'age') input.targetAge = Number(v.targetAge);
  return input;
}

function GoalForm({ goal, navigation }: { goal?: Goal; navigation: ScreenProps<'GoalForm'>['navigation'] }) {
  const { profile } = useAuth();
  const [values, setValues] = useState<Values>(() => initialValues(goal));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K], errorKey?: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => clearField(e, errorKey ?? key));
    setFormError(undefined);
  };

  const birth = profile?.birthDate;
  const preview =
    values.deadlineType === 'age' && birth && Number(values.targetAge) > 0
      ? addYears(birth, Number(values.targetAge))
      : null;
  const daysUntil =
    values.deadlineType === 'date' && isValidDateOnly(values.deadlineDate)
      ? daysBetween(localToday(), values.deadlineDate)
      : preview
        ? daysBetween(localToday(), preview)
        : null;

  const submit = async () => {
    const local = validateGoal(values);
    if (Object.keys(local).length) {
      setErrors(local);
      setFormError(t.common.checkHighlighted);
      return;
    }
    setSubmitting(true);
    setErrors({});
    setFormError(undefined);
    try {
      const saved = goal
        ? await api.goals.update(goal._id, toGoalInput(values))
        : await api.goals.create(toGoalInput(values));
      navigation.replace('GoalDetail', { goalId: saved._id });
    } catch (e) {
      const failure = toFormFailure(e);
      setErrors(failure.fields);
      setFormError(failure.message);
      setSubmitting(false);
    }
  };

  return (
    <FormTemplate
      submitLabel={goal ? t.common.saveChanges : t.goals.create}
      submitting={submitting}
      onSubmit={submit}
      error={formError}
    >
      <TextField
        label={t.goals.fields.title}
        value={values.title}
        onChangeText={(v) => set('title', v)}
        maxLength={LIMITS.goalTitle}
        error={errors.title}
      />
      <TextField
        label={t.goals.fields.whyItMatters}
        value={values.whyItMatters}
        onChangeText={(v) => set('whyItMatters', v)}
        maxLength={LIMITS.whyItMatters}
        multiline
        optional
        error={errors.whyItMatters}
      />
      <TextField
        label={t.goals.fields.notes}
        value={values.notes}
        onChangeText={(v) => set('notes', v)}
        maxLength={LIMITS.notes}
        multiline
        optional
        error={errors.notes}
      />
      <ChoiceRow
        label={t.goals.fields.deadlineType}
        value={values.deadlineType}
        options={[
          { value: 'none', label: t.goals.deadlineTypes.none, hint: t.goals.deadlineTypes.noneHint },
          { value: 'date', label: t.goals.deadlineTypes.date },
          { value: 'age', label: t.goals.deadlineTypes.age },
        ]}
        onChange={(v) => set('deadlineType', v)}
      />
      {values.deadlineType === 'date' ? (
        <DateField
          label={t.goals.fields.deadlineDate}
          value={values.deadlineDate}
          onChange={(v) => set('deadlineDate', v)}
          error={errors.deadlineDate}
        />
      ) : null}
      {values.deadlineType === 'age' ? (
        <>
          <TextField
            label={t.goals.fields.targetAge}
            value={values.targetAge}
            onChangeText={(v) => set('targetAge', v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={3}
            error={errors.targetAge}
            helper={preview ? t.goals.agePreview(preview) : undefined}
          />
          {!birth ? <Notice icon="calendar" message={t.goals.needsBirthDate} /> : null}
        </>
      ) : null}
      <ReminderPicker value={values.reminder} onChange={(r) => set('reminder', r, 'reminder')} daysUntil={daysUntil} />
      {errors.reminder ? <Notice icon="alert-circle" message={errors.reminder} /> : null}
    </FormTemplate>
  );
}

export function GoalFormScreen({ route, navigation }: ScreenProps<'GoalForm'>) {
  const goalId = route.params?.goalId;
  const goal = useResource((signal) => (goalId ? api.goals.get(goalId, { signal }) : Promise.resolve(undefined)), [goalId]);

  if (!goalId) return <GoalForm navigation={navigation} />;
  if (goal.data) return <GoalForm goal={goal.data} navigation={navigation} />;
  return (
    <ScreenTemplate scroll={false}>
      <ResourceView {...goal}>{() => null}</ResourceView>
      {goal.error ? <Button label={t.common.back} variant="quiet" onPress={navigation.goBack} /> : null}
    </ScreenTemplate>
  );
}
