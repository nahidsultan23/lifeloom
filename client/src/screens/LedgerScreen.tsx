import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/molecules/StateViews';
import { TimelineItem } from '../components/organisms/TimelineItem';
import type { RootStackParamList } from '../navigation/types';
import { usePaged } from '../state/usePaged';
import { t } from '../strings';
import { spacing, useTheme } from '../theme';

export function LedgerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = useTheme();
  const list = usePaged((page, limit, signal) => api.timeline.list({ page, limit, signal }));
  const first = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else list.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={list.items}
        keyExtractor={(e) => e._id}
        contentContainerStyle={styles.content}
        refreshing={list.loading && list.items.length > 0}
        onRefresh={list.reload}
        onEndReached={list.loadMore}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText muted>{t.ledger.intro}</AppText>
            <Button label={t.ledger.addMemory} icon="plus" onPress={() => navigation.navigate('MemoryForm')} />
          </View>
        }
        renderItem={({ item }) => (
          <TimelineItem event={item} onPress={() => navigation.navigate('Snapshot', { eventId: item._id })} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          list.loading ? (
            <LoadingState />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.reload} />
          ) : (
            <EmptyState icon="book-open" title={t.ledger.emptyTitle} body={t.ledger.emptyBody} />
          )
        }
        ListFooterComponent={
          list.hasMore && list.items.length > 0 ? (
            <View style={{ paddingTop: spacing.lg }}>
              <Button label={t.common.loadMore} variant="secondary" loading={list.loadingMore} onPress={list.loadMore} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, flexGrow: 1 },
  header: { gap: spacing.md, marginBottom: spacing.lg },
});
