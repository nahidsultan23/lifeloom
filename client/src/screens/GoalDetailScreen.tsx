import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { api, type Goal, type GoalStatus } from '../api';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { Pill } from '../components/atoms/Pill';
import { ConfirmDialog } from '../components/molecules/ConfirmDialog';
import { Notice } from '../components/molecules/Notice';
import { ResourceView, ScreenTemplate } from '../components/templates/ScreenTemplate';
import { defaultFrequency, formatInstant } from '../lib/dates';
import { toFormFailure } from '../lib/fieldErrors';
import { daysUntilDeadline, deadlineLabel, isPastDate, statusLabel } from '../lib/goals';
import type { ScreenProps } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useResource } from '../state/useResource';
import { t } from '../strings';

type Pending = 'letgo' | 'archive' | 'delete' | null;

function reminderLabel(goal: Goal, birthDate?: string): string {
  if (goal.status !== 'active') return t.goals.reminderOffInactive;
  const saved = goal.reminder?.frequency;
  const frequency = (saved ?? defaultFrequency(daysUntilDeadline(goal, birthDate))) as keyof typeof t.reminders.frequency;
  const label = t.reminders.frequency[frequency] ?? t.reminders.frequency.none;
  return goal.reminder?.mode === 'override' ? t.goals.reminderCustom(label) : t.goals.reminderDefault(label);
}

export function GoalDetailScreen({ route, navigation }: ScreenProps<'GoalDetail'>) {
  const { goalId } = route.params;
  const { profile } = useAuth();
  const goal = useResource((signal) => api.goals.get(goalId, { signal }), [goalId]);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const first = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else goal.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const changeStatus = async (status: GoalStatus) => {
    setBusy(true);
    setError(undefined);
    try {
      await api.goals.setStatus(goalId, status);
      setPending(null);
      goal.reload();
    } catch (e) {
      setError(toFormFailure(e).message);
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.goals.remove(goalId);
      navigation.goBack();
    } catch (e) {
      setError(toFormFailure(e).message);
      setPending(null);
      setBusy(false);
    }
  };

  return (
    <ScreenTemplate onRefresh={goal.reload} refreshing={goal.loading && goal.data !== undefined}>
      <ResourceView {...goal}>
        {(g) => {
          const past = isPastDate(g, profile?.birthDate);
          return (
            <>
              <View style={{ gap: 8 }}>
                <AppText variant="title">{g.title}</AppText>
                <AppText muted>{deadlineLabel(g, profile?.birthDate)}</AppText>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Pill label={statusLabel(g.status)} icon={g.status === 'completed' ? 'check' : 'target'} />
                  {past ? <Pill tone="notice" icon="clock" label={t.goals.pastDate} /> : null}
                </View>
              </View>

              {past ? <Notice icon="heart" message={t.goals.pastDateReassure} /> : null}
              {error ? <Notice icon="alert-circle" message={error} /> : null}

              {g.whyItMatters ? (
                <Card>
                  <AppText variant="label">{t.goals.fields.whyItMatters}</AppText>
                  <AppText>{g.whyItMatters}</AppText>
                </Card>
              ) : null}
              {g.notes ? (
                <Card>
                  <AppText variant="label">{t.goals.fields.notes}</AppText>
                  <AppText>{g.notes}</AppText>
                </Card>
              ) : null}
              <Card>
                <AppText variant="label">{t.reminders.title}</AppText>
                <AppText>{reminderLabel(g, profile?.birthDate)}</AppText>
                <AppText variant="caption" muted>
                  {t.reminders.notExact}
                </AppText>
              </Card>
              {g.completedAt ? (
                <AppText muted>{t.goals.completedOn(formatInstant(g.completedAt))}</AppText>
              ) : null}

              <View style={{ gap: 8 }}>
                {g.status === 'active' ? (
                  <>
                    <Button
                      label={past ? t.goals.actions.completeLate : t.goals.actions.complete}
                      icon="check-circle"
                      onPress={() => void changeStatus('completed')}
                      loading={busy && pending === null}
                    />
                    {g.deadlineType !== 'none' ? (
                      <Button label={t.goals.actions.reschedule} icon="calendar" variant="secondary" onPress={() => navigation.navigate('GoalForm', { goalId })} />
                    ) : null}
                    <Button label={t.goals.actions.edit} icon="edit-2" variant="secondary" onPress={() => navigation.navigate('GoalForm', { goalId })} />
                    <Button label={t.goals.actions.addMemory} icon="book-open" variant="secondary" onPress={() => navigation.navigate('MemoryForm', { goalId })} />
                    <Button label={t.goals.actions.letGo} icon="wind" variant="secondary" onPress={() => setPending('letgo')} />
                    <Button label={t.goals.actions.archive} icon="archive" variant="secondary" onPress={() => setPending('archive')} />
                  </>
                ) : (
                  <Button label={t.goals.actions.reopen} icon="rotate-ccw" onPress={() => void changeStatus('active')} loading={busy && pending === null} />
                )}
                <Button label={t.goals.actions.delete} icon="trash-2" variant="quiet" onPress={() => setPending('delete')} />
              </View>
            </>
          );
        }}
      </ResourceView>

      <ConfirmDialog
        visible={pending === 'letgo'}
        title={t.goals.confirm.letGoTitle}
        body={t.goals.confirm.letGoBody}
        confirmLabel={t.goals.actions.letGo}
        busy={busy}
        onConfirm={() => void changeStatus('abandoned')}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        visible={pending === 'archive'}
        title={t.goals.confirm.archiveTitle}
        body={t.goals.confirm.archiveBody}
        confirmLabel={t.goals.actions.archive}
        busy={busy}
        onConfirm={() => void changeStatus('archived')}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        visible={pending === 'delete'}
        title={t.goals.confirm.deleteTitle}
        body={t.goals.confirm.deleteBody}
        confirmLabel={t.goals.actions.delete}
        busy={busy}
        onConfirm={() => void remove()}
        onCancel={() => setPending(null)}
      />
    </ScreenTemplate>
  );
}
