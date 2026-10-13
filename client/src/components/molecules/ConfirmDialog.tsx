import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';
import { t } from '../../strings';
import { AppText } from '../atoms/AppText';
import { Button } from '../atoms/Button';

interface Props {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  error?: string;
  children?: React.ReactNode;
}

/** Confirmation for hard-to-reverse actions. Cancel is always available. */
export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
  error,
  children,
}: Props) {
  const colors = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel={t.common.cancel}
          accessibilityRole="button"
          onPress={busy ? undefined : onCancel}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppText variant="title">{title}</AppText>
          <AppText muted>{body}</AppText>
          {children}
          {error ? (
            <AppText variant="caption" accent accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
          <Button label={confirmLabel} onPress={onConfirm} loading={busy} />
          <Button label={t.common.cancel} variant="quiet" onPress={onCancel} disabled={busy} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(17, 26, 46, 0.55)',
  },
  sheet: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
});
