import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { Notice } from '../components/molecules/Notice';
import { ScreenTemplate } from '../components/templates/ScreenTemplate';
import {
  getPermissionState,
  registerDeviceIfPossible,
  requestPermission,
  type PermissionState,
} from '../lib/notifications';
import { t } from '../strings';

const DEFAULTS: { rule: string; key: keyof typeof t.reminders.frequency }[] = [
  { rule: t.notifications.rules.none, key: 'none' },
  { rule: t.notifications.rules.over365, key: 'monthly' },
  { rule: t.notifications.rules.d90to365, key: 'every_14_days' },
  { rule: t.notifications.rules.d30to89, key: 'weekly' },
  { rule: t.notifications.rules.d7to29, key: 'every_2_days' },
  { rule: t.notifications.rules.under7, key: 'daily' },
];

export function NotificationsScreen() {
  const [state, setState] = useState<PermissionState | undefined>();

  const refresh = useCallback(async () => setState(await getPermissionState()), []);

  useEffect(() => {
    void refresh();
    // Permission can change in system settings, so check again on return.
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const ask = async () => {
    const result = await requestPermission();
    setState(result);
    if (result === 'granted') void registerDeviceIfPossible();
  };

  return (
    <ScreenTemplate>
      <AppText variant="title">{t.notifications.title}</AppText>
      <AppText muted>{t.notifications.explain}</AppText>

      {state === 'granted' ? (
        <Notice icon="check" message={t.notifications.granted} />
      ) : state === 'denied' ? (
        <>
          <Notice icon="bell-off" message={t.notifications.denied} />
          <Button label={t.notifications.openSettings} icon="settings" onPress={() => void Linking.openSettings()} />
        </>
      ) : state === 'undetermined' ? (
        <Button label={t.notifications.turnOn} icon="bell" onPress={ask} />
      ) : null}
      <AppText variant="caption" muted>
        {t.notifications.notLocked}
      </AppText>
      {Platform.OS === 'ios' ? <Notice icon="info" message={t.notifications.iosNote} /> : null}

      <Card>
        <AppText variant="heading">{t.notifications.defaultsTitle}</AppText>
        {DEFAULTS.map((row) => (
          <AppText key={row.key}>
            {row.rule}: {t.reminders.frequency[row.key]}
          </AppText>
        ))}
        <AppText variant="caption" muted>
          {t.notifications.defaultsNote}
        </AppText>
      </Card>
    </ScreenTemplate>
  );
}
