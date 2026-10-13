import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { dateToDateOnly, formatDateOnly } from '../../lib/dates';
import { radius, spacing, touchTarget, useTheme } from '../../theme';
import { AppText } from '../atoms/AppText';
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

/** Calendar date as a date-only string, so the chosen day cannot shift. */
export function DateField({ label, value, onChange, error, minimumDate, maximumDate, optional }: Props) {
  const colors = useTheme();
  return (
    <View style={styles.wrap}>
      <AppText variant="label">
        {label}
        {optional ? ' (optional)' : ''}
      </AppText>
      {createElement('input', {
        type: 'date',
        value,
        min: minimumDate ? dateToDateOnly(minimumDate) : undefined,
        max: maximumDate ? dateToDateOnly(maximumDate) : undefined,
        'aria-label': `${label}: ${value ? formatDateOnly(value) : t.common.notSet}`,
        onChange: (event: { target: { value: string } }) => onChange(event.target.value),
        style: {
          minHeight: touchTarget,
          borderRadius: radius.md,
          paddingLeft: spacing.md,
          paddingRight: spacing.md,
          backgroundColor: colors.surface,
          color: colors.text,
          border: `${error ? 2 : 1}px solid ${error ? colors.accentText : colors.border}`,
          font: 'inherit',
        },
      })}
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
});
