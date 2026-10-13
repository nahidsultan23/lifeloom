import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { radius, spacing, touchTarget, type, useTheme } from '../../theme';
import { AppText } from '../atoms/AppText';

interface Props
  extends Pick<
    TextInputProps,
    'keyboardType' | 'autoCapitalize' | 'placeholder' | 'editable' | 'returnKeyType'
  > {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Enforced in the UI. The server rejects anything past the same limit. */
  maxLength?: number;
  multiline?: boolean;
  error?: string;
  helper?: string;
  optional?: boolean;
}

export function TextField({
  label,
  value,
  onChangeText,
  maxLength,
  multiline,
  error,
  helper,
  optional,
  ...rest
}: Props) {
  const colors = useTheme();
  return (
    <View style={styles.wrap}>
      <AppText variant="label">
        {label}
        {optional ? ' (optional)' : ''}
      </AppText>
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        multiline={multiline}
        accessibilityLabel={optional ? `${label} (optional)` : label}
        accessibilityHint={error ?? helper}
        placeholderTextColor={colors.textMuted}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          type.body,
          styles.input,
          multiline && styles.multiline,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.accentText : colors.border,
            borderWidth: error ? 2 : 1,
          },
        ]}
      />
      <View style={styles.footer}>
        <View style={styles.footerText}>
          {error ? (
            <AppText variant="caption" accent accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : helper ? (
            <AppText variant="caption" muted>
              {helper}
            </AppText>
          ) : null}
        </View>
        {maxLength ? (
          <AppText variant="caption" muted>
            {value.length} / {maxLength}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  input: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: { minHeight: 110 },
  footer: { flexDirection: 'row', gap: spacing.sm },
  footerText: { flex: 1 },
});
