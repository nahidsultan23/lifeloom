import type { GoalReminder } from '../../api';
import { defaultFrequency, type ReminderFrequency } from '../../lib/dates';
import { t } from '../../strings';
import { ChoiceRow, type Choice } from '../molecules/ChoiceRow';

const ORDER: ReminderFrequency[] = ['daily', 'every_2_days', 'weekly', 'every_14_days', 'monthly', 'none'];

interface Props {
  value: GoalReminder;
  onChange: (value: GoalReminder) => void;
  /** Days until the deadline, or null with no deadline. Drives the default shown. */
  daysUntil: number | null;
}

/**
 * Lets the person keep the default frequency or choose their own, including
 * none. The saved value is stored on the server, so another device keeps it.
 */
export function ReminderPicker({ value, onChange, daysUntil }: Props) {
  const fallback = defaultFrequency(daysUntil);
  const options: Choice<string>[] = [
    {
      value: 'default',
      label: t.reminders.useDefault,
      hint: t.reminders.defaultHint(t.reminders.frequency[fallback]),
    },
    ...ORDER.map((frequency) => ({
      value: frequency,
      label: t.reminders.frequency[frequency],
    })),
  ];
  const selected = value.mode === 'override' && value.frequency ? value.frequency : 'default';

  return (
    <ChoiceRow
      label={t.reminders.title}
      value={selected}
      options={options}
      onChange={(next) =>
        onChange(next === 'default' ? { mode: 'default' } : { mode: 'override', frequency: next })
      }
    />
  );
}
