import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';

interface Props extends ViewProps {
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function Card({ onPress, accessibilityLabel, style, children, ...rest }: Props) {
  const colors = useTheme();
  const base = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.border },
    style,
  ];
  if (!onPress) {
    return (
      <View {...rest} style={base}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
