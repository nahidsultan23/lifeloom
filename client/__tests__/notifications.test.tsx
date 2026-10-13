import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

const mockNotifications: Record<
  'getPermissionState' | 'requestPermission' | 'registerDeviceIfPossible',
  jest.Mock
> = {
  getPermissionState: jest.fn(),
  requestPermission: jest.fn(),
  registerDeviceIfPossible: jest.fn(async () => null),
};

jest.mock('../src/lib/notifications', () => ({
  getPermissionState: (...args: unknown[]) => mockNotifications.getPermissionState(...args),
  requestPermission: (...args: unknown[]) => mockNotifications.requestPermission(...args),
  registerDeviceIfPossible: (...args: unknown[]) => mockNotifications.registerDeviceIfPossible(...args),
}));

import { NotificationsScreen } from '../src/screens/NotificationsScreen';
import { t } from '../src/strings';

beforeEach(() => jest.clearAllMocks());

describe('notification settings', () => {
  it('explains the ask and lets the person turn notifications on', async () => {
    mockNotifications.getPermissionState.mockResolvedValue('undetermined');
    mockNotifications.requestPermission.mockResolvedValue('granted');
    await render(<NotificationsScreen />);
    expect(screen.getByText(/stay discreet/)).toBeTruthy();
    await fireEvent.press(await screen.findByLabelText('Turn on notifications'));
    expect(await screen.findByText('Notifications are on.')).toBeTruthy();
    expect(mockNotifications.registerDeviceIfPossible).toHaveBeenCalled();
  });

  it('handles a denied permission calmly and points to phone settings', async () => {
    mockNotifications.getPermissionState.mockResolvedValue('denied');
    const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    await render(<NotificationsScreen />);
    expect(await screen.findByText(/turn them on there whenever you like/)).toBeTruthy();
    expect(screen.queryByLabelText('Turn on notifications')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Open phone settings'));
    expect(open).toHaveBeenCalled();
  });

  it('shows the same default frequencies the server uses', async () => {
    mockNotifications.getPermissionState.mockResolvedValue('granted');
    await render(<NotificationsScreen />);
    await waitFor(() => expect(screen.getByText('Notifications are on.')).toBeTruthy());
    const r = t.notifications.rules;
    const f = t.reminders.frequency;
    expect(screen.getByText(`${r.none}: ${f.none}`)).toBeTruthy();
    expect(screen.getByText(`${r.over365}: ${f.monthly}`)).toBeTruthy();
    expect(screen.getByText(`${r.d90to365}: ${f.every_14_days}`)).toBeTruthy();
    expect(screen.getByText(`${r.d30to89}: ${f.weekly}`)).toBeTruthy();
    expect(screen.getByText(`${r.d7to29}: ${f.every_2_days}`)).toBeTruthy();
    expect(screen.getByText(`${r.under7}: ${f.daily}`)).toBeTruthy();
  });
});
