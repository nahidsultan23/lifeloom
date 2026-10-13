import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '../api';
import { config } from '../config';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders and letters',
    importance: Notifications.AndroidImportance.DEFAULT,
    // Lock-screen text stays discreet. Nothing private is shown there.
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}

export async function getPermissionState(): Promise<PermissionState> {
  const result = await Notifications.getPermissionsAsync();
  if (result.granted) return 'granted';
  return result.canAskAgain ? 'undetermined' : 'denied';
}

export async function requestPermission(): Promise<PermissionState> {
  await ensureAndroidChannel();
  const result = await Notifications.requestPermissionsAsync();
  if (result.granted) return 'granted';
  return result.canAskAgain ? 'undetermined' : 'denied';
}

/**
 * The server sends through FCM. Android's device token is an FCM token, so it
 * is registered. iOS hands out an APNs token, which the server cannot use
 * without Firebase on iOS, so nothing is registered there. See docs/handoff.md.
 */
export async function registerDeviceIfPossible(): Promise<string | null> {
  if (!config.features.pushRegistration || Platform.OS !== 'android') return null;
  if ((await getPermissionState()) !== 'granted') return null;
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    if (typeof token.data !== 'string' || !token.data) return null;
    await api.devices.register(token.data, 'android');
    return token.data;
  } catch {
    return null;
  }
}

export async function unregisterDevice(token: string | null): Promise<void> {
  if (!token) return;
  try {
    await api.devices.remove(token);
  } catch {
    // Best effort. Sign-out must not fail because of this.
  }
}
