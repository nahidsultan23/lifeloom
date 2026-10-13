import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '../../theme';
import { ApiError } from '../../api/client';
import { t } from '../../strings';
import { AppText } from '../atoms/AppText';
import { Button } from '../atoms/Button';
import { Icon, type IconName } from '../atoms/Icon';

export function LoadingState({ label = t.common.loading }: { label?: string }) {
  const colors = useTheme();
  return (
    <View style={styles.center} accessibilityLiveRegion="polite" accessibilityLabel={label}>
      <ActivityIndicator color={colors.primary} />
      <AppText muted>{label}</AppText>
    </View>
  );
}

interface EmptyProps {
  icon?: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'feather', title, body, actionLabel, onAction }: EmptyProps) {
  return (
    <View style={styles.center}>
      <Icon name={icon} size={36} accent />
      <AppText variant="heading" style={styles.centerText}>
        {title}
      </AppText>
      {body ? (
        <AppText muted style={styles.centerText}>
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Icon name={error.isOffline ? 'wifi-off' : 'cloud-off'} size={36} accent />
      <AppText variant="heading" style={styles.centerText}>
        {error.isOffline ? t.errors.offlineTitle : t.errors.loadFailedTitle}
      </AppText>
      <AppText muted style={styles.centerText}>
        {error.message}
      </AppText>
      <Button label={t.common.tryAgain} icon="refresh-cw" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  centerText: { textAlign: 'center' },
});
