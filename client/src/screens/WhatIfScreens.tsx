import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, ApiError, type WhatIfPath } from '../api';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { ConfirmDialog } from '../components/molecules/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/molecules/StateViews';
import { Notice } from '../components/molecules/Notice';
import { TextField } from '../components/molecules/TextField';
import { AttachmentSection } from '../components/organisms/AttachmentSection';
import { FormTemplate } from '../components/templates/FormTemplate';
import { ResourceView, ScreenTemplate } from '../components/templates/ScreenTemplate';
import { clearField, toFormFailure } from '../lib/fieldErrors';
import { findInPages } from '../lib/findInPages';
import { LIMITS } from '../lib/limits';
import type { ScreenProps } from '../navigation/types';
import { usePaged } from '../state/usePaged';
import { useResource } from '../state/useResource';
import { t } from '../strings';
import { spacing, useTheme } from '../theme';

async function loadPath(id: string): Promise<WhatIfPath> {
  const found = await findInPages((page, limit) => api.whatIf.list({ page, limit }), id);
  if (!found) throw new ApiError('http', 404, 'RESOURCE_NOT_FOUND', t.errors.notFound);
  return found;
}

export function WhatIfListScreen({ navigation }: ScreenProps<'WhatIfList'>) {
  const colors = useTheme();
  const list = usePaged((page, limit, signal) => api.whatIf.list({ page, limit, signal }));
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else list.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={list.items}
        keyExtractor={(p) => p._id}
        contentContainerStyle={styles.content}
        onEndReached={list.loadMore}
        refreshing={list.loading && list.items.length > 0}
        onRefresh={list.reload}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText muted>{t.whatIf.intro}</AppText>
            <Button label={t.whatIf.add} icon="plus" onPress={() => navigation.navigate('WhatIfForm')} />
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('WhatIfDetail', { pathId: item._id })} accessibilityLabel={item.title}>
            <AppText variant="heading">{item.title}</AppText>
            {item.description ? (
              <AppText muted numberOfLines={2}>
                {item.description}
              </AppText>
            ) : null}
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          list.loading ? (
            <LoadingState />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.reload} />
          ) : (
            <EmptyState icon="git-branch" title={t.whatIf.emptyTitle} body={t.whatIf.emptyBody} />
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

function WhatIfForm({ path, navigation }: { path?: WhatIfPath; navigation: ScreenProps<'WhatIfForm'>['navigation'] }) {
  const [title, setTitle] = useState(path?.title ?? '');
  const [description, setDescription] = useState(path?.description ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      setErrors({ title: t.whatIf.errors.titleRequired });
      setFormError(t.common.checkHighlighted);
      return;
    }
    setSubmitting(true);
    setErrors({});
    setFormError(undefined);
    try {
      const body = { title: title.trim(), description: description.trim() };
      const saved = path ? await api.whatIf.update(path._id, body) : await api.whatIf.create(body);
      navigation.replace('WhatIfDetail', { pathId: saved._id });
    } catch (e) {
      const failure = toFormFailure(e);
      setErrors(failure.fields);
      setFormError(failure.message);
      setSubmitting(false);
    }
  };

  return (
    <FormTemplate submitLabel={path ? t.common.saveChanges : t.whatIf.create} submitting={submitting} onSubmit={submit} error={formError}>
      <Notice icon="info" message={t.whatIf.writtenByYou} />
      <TextField
        label={t.whatIf.fields.title}
        value={title}
        onChangeText={(v) => {
          setTitle(v);
          setErrors((e) => clearField(e, 'title'));
        }}
        maxLength={LIMITS.whatIfTitle}
        error={errors.title}
      />
      <TextField
        label={t.whatIf.fields.description}
        value={description}
        onChangeText={(v) => {
          setDescription(v);
          setErrors((e) => clearField(e, 'description'));
        }}
        maxLength={LIMITS.whatIfDescription}
        multiline
        optional
        error={errors.description}
      />
    </FormTemplate>
  );
}

export function WhatIfFormScreen({ route, navigation }: ScreenProps<'WhatIfForm'>) {
  const pathId = route.params?.pathId;
  const path = useResource(() => (pathId ? loadPath(pathId) : Promise.resolve(undefined)), [pathId]);
  if (!pathId) return <WhatIfForm navigation={navigation} />;
  if (path.data) return <WhatIfForm path={path.data} navigation={navigation} />;
  return (
    <ScreenTemplate scroll={false}>
      <ResourceView {...path}>{() => null}</ResourceView>
    </ScreenTemplate>
  );
}

export function WhatIfDetailScreen({ route, navigation }: ScreenProps<'WhatIfDetail'>) {
  const { pathId } = route.params;
  const path = useResource(() => loadPath(pathId), [pathId]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else path.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const remove = async () => {
    setBusy(true);
    try {
      await api.whatIf.remove(pathId);
      navigation.goBack();
    } catch (e) {
      setError(toFormFailure(e).message);
      setConfirm(false);
      setBusy(false);
    }
  };

  return (
    <ScreenTemplate>
      <ResourceView {...path}>
        {(p) => (
          <>
            <AppText variant="title">{p.title}</AppText>
            {error ? <Notice icon="alert-circle" message={error} /> : null}
            {p.description ? (
              <Card>
                <AppText>{p.description}</AppText>
              </Card>
            ) : null}
            <AttachmentSection purpose="what-if" parentId={p._id} attachmentIds={p.attachmentIds ?? []} onChanged={path.reload} />
            <Button label={t.common.edit} icon="edit-2" variant="secondary" onPress={() => navigation.navigate('WhatIfForm', { pathId })} />
            <Button label={t.whatIf.delete} icon="trash-2" variant="quiet" onPress={() => setConfirm(true)} />
          </>
        )}
      </ResourceView>
      <ConfirmDialog
        visible={confirm}
        title={t.whatIf.deleteTitle}
        body={t.whatIf.deleteBody}
        confirmLabel={t.whatIf.delete}
        busy={busy}
        onConfirm={() => void remove()}
        onCancel={() => setConfirm(false)}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, flexGrow: 1 },
  header: { gap: spacing.md, marginBottom: spacing.lg },
});
