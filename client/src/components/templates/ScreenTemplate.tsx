import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../../api/client';
import { spacing, useTheme } from '../../theme';
import { ErrorState, LoadingState } from '../molecules/StateViews';

interface Props {
  children: React.ReactNode;
  /** Edges that need safe-area padding. Navigator headers handle the top. */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  scroll?: boolean;
  keyboardDismiss?: boolean;
  /** Pull to refresh. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Pinned below the scrolling content. */
  footer?: React.ReactNode;
}

export function ScreenTemplate({
  children,
  edges = ['bottom', 'left', 'right'],
  scroll = true,
  keyboardDismiss = true,
  onRefresh,
  refreshing,
  footer,
}: Props) {
  const colors = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={keyboardDismiss ? 'on-drag' : 'none'}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

interface ResourceProps<T> {
  data: T | undefined;
  loading: boolean;
  error: ApiError | undefined;
  reload: () => void;
  children: (data: T) => React.ReactNode;
}

/** Loading, error with retry, or the content. Keeps old data visible during a reload. */
export function ResourceView<T>({ data, loading, error, reload, children }: ResourceProps<T>) {
  if (data === undefined) {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    return null;
  }
  return <>{children(data)}</>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  footer: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm },
});
