import { StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';
import { AppText } from '../atoms/AppText';
import { Button } from '../atoms/Button';
import { Icon, type IconName } from '../atoms/Icon';

interface Props {
  message: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

/** A calm inline message. Used for form-level errors, offline hints, and tips. */
export function Notice({ message, icon = 'info', actionLabel, onAction }: Props) {
  const colors = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: colors.notice }]}
    >
      <View style={styles.row}>
        <Icon name={icon} size={18} color={colors.onNotice} />
        <AppText style={[styles.text, { color: colors.onNotice }]}>{message}</AppText>
      </View>
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  text: { flex: 1 },
});
