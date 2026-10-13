import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, type Goal } from '../api';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/molecules/StateViews';
import { TextField } from '../components/molecules/TextField';
import { GoalCard } from '../components/organisms/GoalCard';
import { LIMITS } from '../lib/limits';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { usePaged } from '../state/usePaged';
import { t } from '../strings';
import { spacing, useTheme } from '../theme';

type Filter = 'active' | 'completed' | 'other';
const FILTERS: Filter[] = ['active', 'completed', 'other'];

function matches(goal: Goal, filter: Filter): boolean {
  if (filter === 'active') return goal.status === 'active';
  if (filter === 'completed') return goal.status === 'completed';
  return goal.status === 'abandoned' || goal.status === 'archived';
}

export function GoalsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = useTheme();
  const { profile } = useAuth();
  const [filter, setFilter] = useState<Filter>('active');
  const [query, setQuery] = useState('');
  const list = usePaged((page, limit, signal) => api.goals.list({ page, limit, signal }));
  const first = useRef(true);

  // Reload when coming back from a form or detail screen.
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else list.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const needle = query.trim().toLowerCase();
  const visible = list.items.filter(
    (g) => matches(g, filter) && (!needle || g.title.toLowerCase().includes(needle)),
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={visible}
        keyExtractor={(g) => g._id}
        contentContainerStyle={styles.content}
        refreshing={list.loading && list.items.length > 0}
        onRefresh={list.reload}
        onEndReached={list.loadMore}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button label={t.goals.add} icon="plus" onPress={() => navigation.navigate('GoalForm')} />
            <View style={styles.filters}>
              {FILTERS.map((f) => (
                <View key={f} style={styles.flex}>
                  <Button
                    label={t.goals.filters[f]}
                    variant={filter === f ? 'primary' : 'secondary'}
                    onPress={() => setFilter(f)}
                  />
                </View>
              ))}
            </View>
            <TextField
              label={t.goals.search}
              value={query}
              onChangeText={setQuery}
              maxLength={LIMITS.search}
              autoCapitalize="none"
            />
          </View>
        }
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            birthDate={profile?.birthDate}
            onPress={() => navigation.navigate('GoalDetail', { goalId: item._id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          list.loading ? (
            <LoadingState />
          ) : list.error && list.items.length === 0 ? (
            <ErrorState error={list.error} onRetry={list.reload} />
          ) : list.items.length === 0 ? (
            <EmptyState
              icon="target"
              title={t.goals.emptyTitle}
              body={t.goals.emptyBody}
              actionLabel={t.goals.add}
              onAction={() => navigation.navigate('GoalForm')}
            />
          ) : (
            <AppText muted style={styles.none}>
              {t.goals.noneInFilter}
            </AppText>
          )
        }
        ListFooterComponent={
          list.hasMore && list.items.length > 0 ? (
            <View style={styles.footer}>
              <Button label={t.common.loadMore} variant="secondary" loading={list.loadingMore} onPress={list.loadMore} />
            </View>
          ) : list.error && list.items.length > 0 ? (
            <ErrorState error={list.error} onRetry={list.reload} />
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
  filters: { flexDirection: 'row', gap: spacing.sm },
  none: { textAlign: 'center', padding: spacing.xl },
  footer: { paddingTop: spacing.lg },
});
