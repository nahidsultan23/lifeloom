import { useState } from 'react';
import { api, ApiError, type TimelineEvent } from '../api';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { Pill } from '../components/atoms/Pill';
import { ConfirmDialog } from '../components/molecules/ConfirmDialog';
import { Notice } from '../components/molecules/Notice';
import { AttachmentSection } from '../components/organisms/AttachmentSection';
import { ResourceView, ScreenTemplate } from '../components/templates/ScreenTemplate';
import { formatInstant } from '../lib/dates';
import { toFormFailure } from '../lib/fieldErrors';
import { findInPages } from '../lib/findInPages';
import { deadlineLabel } from '../lib/goals';
import type { ScreenProps } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useResource } from '../state/useResource';
import { t } from '../strings';

/**
 * Retrospective view. Everything shown here is the snapshot stored when the
 * event happened. It is never rebuilt from the goal as it is now.
 */
export function SnapshotScreen({ route, navigation }: ScreenProps<'Snapshot'>) {
  const { eventId } = route.params;
  const { profile } = useAuth();
  const event = useResource(
    async () => {
      const found = await findInPages((page, limit) => api.timeline.list({ page, limit }), eventId);
      if (!found) throw new ApiError('http', 404, 'RESOURCE_NOT_FOUND', t.errors.notFound);
      return found;
    },
    [eventId],
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const removeMemory = async () => {
    setBusy(true);
    try {
      await api.timeline.removeMemory(eventId);
      navigation.goBack();
    } catch (e) {
      setError(toFormFailure(e).message);
      setConfirmDelete(false);
      setBusy(false);
    }
  };

  const render = (e: TimelineEvent) => {
    const s = e.snapshot ?? {};
    const isMemory = e.eventType === 'memory';
    return (
      <>
        <AppText variant="title">{t.ledger.snapshotTitle(formatInstant(e.occurredAt))}</AppText>
        <Pill icon="clock" label={t.ledger.events[e.eventType]} />
        <Notice icon="info" message={isMemory ? t.ledger.memoryNote : t.ledger.snapshotNote} />
        {error ? <Notice icon="alert-circle" message={error} /> : null}

        {isMemory ? (
          <Card>
            <AppText>{e.note || t.ledger.noNote}</AppText>
          </Card>
        ) : (
          <Card>
            <AppText variant="heading">{s.title}</AppText>
            <AppText muted>{deadlineLabel({ deadlineType: s.deadlineType ?? 'none', deadlineDate: s.deadlineDate, targetAge: s.targetAge }, profile?.birthDate)}</AppText>
            {s.status ? <AppText>{t.ledger.statusThen(t.goals.status[s.status])}</AppText> : null}
            {s.whyItMatters ? <AppText>{s.whyItMatters}</AppText> : null}
            {s.notes ? <AppText muted>{s.notes}</AppText> : null}
          </Card>
        )}

        {isMemory ? (
          <>
            <AttachmentSection purpose="memory" parentId={e._id} attachmentIds={e.attachmentIds ?? []} onChanged={event.reload} />
            <Button label={t.ledger.deleteMemory} icon="trash-2" variant="quiet" onPress={() => setConfirmDelete(true)} />
          </>
        ) : e.goalId ? (
          <Button label={t.ledger.openGoal} icon="target" variant="secondary" onPress={() => navigation.navigate('GoalDetail', { goalId: e.goalId! })} />
        ) : null}
      </>
    );
  };

  return (
    <ScreenTemplate>
      <ResourceView {...event}>{render}</ResourceView>
      <ConfirmDialog
        visible={confirmDelete}
        title={t.ledger.deleteTitle}
        body={t.ledger.deleteBody}
        confirmLabel={t.ledger.deleteMemory}
        busy={busy}
        onConfirm={() => void removeMemory()}
        onCancel={() => setConfirmDelete(false)}
      />
    </ScreenTemplate>
  );
}
