import { Pressable, StyleSheet, View } from 'react-native';
import { radius, spacing, touchTarget, useTheme } from '../../theme';
import { AppText } from '../atoms/AppText';
import { Icon } from '../atoms/Icon';

export interface Choice<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: Choice<T>[];
  onChange: (value: T) => void;
}

/** Single choice from a short list. Selection shows a check mark and a border, not only color. */
export function ChoiceRow<T extends string>({ label, value, options, onChange }: Props<T>) {
  const colors = useTheme();
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <AppText variant="label">{label}</AppText>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            accessibilityHint={option.hint}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              {
                backgroundColor: colors.surface,
                borderColor: selected ? colors.primary : colors.border,
                borderWidth: selected ? 2 : 1,
              },
            ]}
          >
            <View style={styles.text}>
              <AppText>{option.label}</AppText>
              {option.hint ? (
                <AppText variant="caption" muted>
                  {option.hint}
                </AppText>
              ) : null}
            </View>
            <Icon name={selected ? 'check-circle' : 'circle'} size={20} accent={selected} muted={!selected} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  option: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: { flex: 1 },
});
