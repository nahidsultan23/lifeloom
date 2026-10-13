import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { dateOnlyToPickerDate, dateToDateOnly, formatDateOnly } from '../../lib/dates';
import { radius, spacing, touchTarget, useTheme } from '../../theme';
import { AppText } from '../atoms/AppText';
import { Icon } from '../atoms/Icon';
import { t } from '../../strings';

interface Props {
  label: string;
  /** Date-only value, "YYYY-MM-DD", or empty. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  optional?: boolean;
}

/** Picks a calendar date. Works in date-only strings so a day cannot shift. */
export function DateField({ label, value, onChange, error, minimumDate, maximumDate, optional }: Props) {
  const colors = useTheme();
  const [open, setOpen] = useState(false);

  const handle = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && date) onChange(dateToDateOnly(date));
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="label">
        {label}
        {optional ? ' (optional)' : ''}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDateOnly(value) : t.common.notSet}`}
        onPress={() => setOpen((o) => !o)}
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.accentText : colors.border,
            borderWidth: error ? 2 : 1,
          },
        ]}
      >
        <AppText>{value ? formatDateOnly(value) : t.common.chooseDate}</AppText>
        <Icon name="calendar" size={20} muted />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={dateOnlyToPickerDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handle}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}
      {error ? (
        <AppText variant="caption" accent accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  field: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
