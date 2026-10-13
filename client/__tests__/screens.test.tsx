import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

const mockApi = {
  goals: { create: jest.fn(), update: jest.fn(), get: jest.fn() },
  updates: { check: jest.fn() },
};

jest.mock('../src/api', () => {
  const actual = jest.requireActual('../src/api/client');
  return {
    __esModule: true,
    ApiError: actual.ApiError,
    get api() {
      return mockApi;
    },
  };
});

const mockAuth: Record<string, unknown> = {
  status: 'signedOut',
  profile: { birthDate: '1994-06-21', email: 'me@example.com', displayName: 'Sam' },
  sessionNotice: undefined,
  signIn: jest.fn(),
  previewSignIn: jest.fn(),
};

jest.mock('../src/state/AuthContext', () => ({ useAuth: () => mockAuth }));

import { ApiError } from '../src/api/client';
import { GoalFormScreen } from '../src/screens/GoalFormScreen';
import { RequiredUpdateScreen } from '../src/screens/RequiredUpdateScreen';
import { WelcomeScreen } from '../src/screens/WelcomeScreen';
import { UpdateProvider, useUpdates } from '../src/state/UpdateContext';
import { validateLetter } from '../src/screens/LetterScreens';

const navigation = { replace: jest.fn(), goBack: jest.fn(), navigate: jest.fn() };
const route = { key: 'k', name: 'GoalForm' as const, params: undefined };

function renderGoalForm() {
  return render(<GoalFormScreen navigation={navigation as never} route={route as never} />);
}

beforeEach(async () => {
  jest.clearAllMocks();
  // A saved "update required" policy must not leak from one test into the next.
  await jest.requireMock('expo-secure-store').deleteItemAsync('lifeloom.update.required.v1');
});

describe('goal form', () => {
  it('asks for a title before sending anything', async () => {
    await renderGoalForm();
    await fireEvent.press(screen.getByLabelText('Create goal'));
    expect(await screen.findByText('Give your goal a title.')).toBeTruthy();
    expect(screen.getByText('Please check the highlighted fields.')).toBeTruthy();
    expect(mockApi.goals.create).not.toHaveBeenCalled();
  });

  it('creates a goal with no deadline and no reminder promise', async () => {
    mockApi.goals.create.mockResolvedValue({ _id: 'g1' });
    await renderGoalForm();
    await fireEvent.changeText(screen.getByLabelText('Title'), '  Learn to sail  ');
    await fireEvent.press(screen.getByLabelText('Create goal'));
    await waitFor(() => expect(mockApi.goals.create).toHaveBeenCalled());
    expect(mockApi.goals.create.mock.calls[0][0]).toMatchObject({
      title: 'Learn to sail',
      deadlineType: 'none',
      reminder: { mode: 'default' },
    });
    expect(mockApi.goals.create.mock.calls[0][0]).not.toHaveProperty('deadlineDate');
    expect(navigation.replace).toHaveBeenCalledWith('GoalDetail', { goalId: 'g1' });
  });

  it('requires a date once "A date" is chosen', async () => {
    await renderGoalForm();
    await fireEvent.changeText(screen.getByLabelText('Title'), 'Run a 10k');
    await fireEvent.press(screen.getByLabelText('A date'));
    await fireEvent.press(screen.getByLabelText('Create goal'));
    expect(await screen.findByText('Choose a date.')).toBeTruthy();
    expect(mockApi.goals.create).not.toHaveBeenCalled();
  });

  it('keeps what was typed and shows the server message under the right field', async () => {
    mockApi.goals.create.mockRejectedValue(
      new ApiError('http', 422, 'VALIDATION_ERROR', 'One or more fields are invalid', {
        notes: 'must be shorter than or equal to 2000 characters',
      }),
    );
    await renderGoalForm();
    await fireEvent.changeText(screen.getByLabelText('Title'), 'Write a book');
    await fireEvent.changeText(screen.getByLabelText('Notes (optional)'), 'chapter ideas');
    await fireEvent.press(screen.getByLabelText('Create goal'));

    expect(await screen.findByText('Notes must be shorter than or equal to 2000 characters')).toBeTruthy();
    expect(screen.getByText('One or more fields are invalid')).toBeTruthy();
    expect(screen.getByLabelText('Title').props.value).toBe('Write a book');
    expect(screen.getByLabelText('Notes (optional)').props.value).toBe('chapter ideas');

    // Fixing the field clears its stale error.
    await fireEvent.changeText(screen.getByLabelText('Notes (optional)'), 'shorter');
    await waitFor(() => expect(screen.queryByText(/Notes must be shorter/)).toBeNull());
  });

  it('shows a retryable message for a dropped network and keeps the values', async () => {
    mockApi.goals.create.mockRejectedValue(new ApiError('network', 0, 'NETWORK', 'Lifeloom could not reach the internet. Check your connection and try again.'));
    await renderGoalForm();
    await fireEvent.changeText(screen.getByLabelText('Title'), 'Plant a tree');
    await fireEvent.press(screen.getByLabelText('Create goal'));
    expect(await screen.findByText(/could not reach the internet/)).toBeTruthy();
    expect(screen.getByLabelText('Title').props.value).toBe('Plant a tree');
    mockApi.goals.create.mockResolvedValue({ _id: 'g2' });
    await fireEvent.press(screen.getByLabelText('Create goal'));
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('GoalDetail', { goalId: 'g2' }));
  });
});

describe('letter validation', () => {
  const base = { body: 'Hello me', deliveryType: 'date' as const, deliveryDate: '2040-01-01', targetAge: '' };

  it('accepts a future date', async () => {
    expect(validateLetter(base, undefined, '2030-01-01')).toEqual({});
  });

  it('rejects today, the past, and empty text', async () => {
    expect(validateLetter(base, undefined, '2040-01-01').deliveryDate).toBeTruthy();
    expect(validateLetter({ ...base, deliveryDate: '2020-01-01' }, undefined, '2030-01-01').deliveryDate).toBeTruthy();
    expect(validateLetter({ ...base, body: '   ' }, undefined, '2030-01-01').body).toBeTruthy();
  });

  it('needs a birth date for an age delivery, and the age must be in the future', async () => {
    const age = { ...base, deliveryType: 'age' as const, targetAge: '60' };
    expect(validateLetter(age, undefined, '2030-01-01').targetAge).toMatch(/birth date/);
    expect(validateLetter(age, '1994-06-21', '2030-01-01')).toEqual({});
    expect(validateLetter({ ...age, targetAge: '20' }, '1994-06-21', '2030-01-01').targetAge).toBeTruthy();
    expect(validateLetter({ ...age, targetAge: '999' }, '1994-06-21', '2030-01-01').targetAge).toBeTruthy();
  });
});

describe('welcome screen', () => {
  it('blocks sign-in until the required consent is on', async () => {
    mockAuth.signIn = jest.fn().mockResolvedValue({ ok: false, cancelled: true, message: '' });
    await render(<WelcomeScreen />);
    const signIn = screen.getByLabelText('Continue with Google');
    expect(signIn.props.accessibilityState.disabled).toBe(true);
    await fireEvent(screen.getByLabelText('I understand how Lifeloom uses my data'), 'valueChange', true);
    await waitFor(() => expect(screen.getByLabelText('Continue with Google').props.accessibilityState.disabled).toBe(false));
    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Continue with Google'));
    });
    expect(mockAuth.signIn).toHaveBeenCalledTimes(1);
  });

  it('offers the test account in a development build', async () => {
    mockAuth.previewSignIn = jest.fn().mockResolvedValue({ ok: true });
    await render(<WelcomeScreen />);
    await fireEvent(screen.getByLabelText('I understand how Lifeloom uses my data'), 'valueChange', true);
    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Continue as test@gmail.com'));
    });
    expect(mockAuth.previewSignIn).toHaveBeenCalledTimes(1);
    expect(mockAuth.signIn).not.toHaveBeenCalled();
  });

  it('shows why a session ended and shows a sign-in failure, and has no ad', async () => {
    mockAuth.sessionNotice = 'Your session ended, so you were signed out.';
    mockAuth.signIn = jest.fn().mockResolvedValue({ ok: false, cancelled: false, message: 'Google sign-in did not finish. Please try again.' });
    await render(<WelcomeScreen />);
    expect(screen.getByText(/session ended/)).toBeTruthy();
    await fireEvent(screen.getByLabelText('I understand how Lifeloom uses my data'), 'valueChange', true);
    await act(async () => {
      await fireEvent.press(screen.getByLabelText('Continue with Google'));
    });
    expect(await screen.findByText(/did not finish/)).toBeTruthy();
    expect(screen.queryByTestId('banner-ad')).toBeNull();
    mockAuth.sessionNotice = undefined;
  });
});

const policy = {
  latestVersion: '2.0.0',
  minimumVersion: '1.5.0',
  minimumBuild: 1,
  storeUrl: 'https://store.example/app',
  releaseNotes: ['Better reminders'],
  policyVersion: 3,
};

describe('required update screen', () => {
  it('explains, offers Update, and offers no way to dismiss', async () => {
    const onRecheck = jest.fn();
    await render(<RequiredUpdateScreen policy={policy} onRecheck={onRecheck} />);
    expect(screen.getByText('Please update Lifeloom')).toBeTruthy();
    expect(screen.getByText(/no longer supported/)).toBeTruthy();
    expect(screen.getByText('• Better reminders')).toBeTruthy();
    expect(screen.getByLabelText('Update')).toBeTruthy();
    expect(screen.queryByLabelText('Not now')).toBeNull();
    expect(screen.queryByLabelText('Cancel')).toBeNull();
    await fireEvent.press(screen.getByLabelText('I have updated, check again'));
    expect(onRecheck).toHaveBeenCalled();
  });
});

function UpdateProbe() {
  const { required, optional, dismissOptional, recheck } = useUpdates();
  return (
    <>
      <Text testID="required">{required ? 'blocked' : 'open'}</Text>
      <Text testID="optional">{optional ? optional.latestVersion : 'none'}</Text>
      <Text onPress={dismissOptional}>dismiss</Text>
      <Text onPress={() => void recheck()}>recheck</Text>
    </>
  );
}

describe('update provider', () => {
  it('blocks when the server says the version is required', async () => {
    mockApi.updates.check.mockResolvedValue({ updateAvailable: true, required: true, policy });
    await render(
      <UpdateProvider>
        <UpdateProbe />
      </UpdateProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('required').children[0]).toBe('blocked'));
  });

  it('does not lock the app when the check fails and nothing was known', async () => {
    mockApi.updates.check.mockRejectedValue(new ApiError('network', 0, 'NETWORK', 'offline'));
    await render(
      <UpdateProvider>
        <UpdateProbe />
      </UpdateProvider>,
    );
    await waitFor(() => expect(mockApi.updates.check).toHaveBeenCalled());
    expect(screen.getByTestId('required').children[0]).toBe('open');
  });

  it('keeps a known block when the next check fails', async () => {
    mockApi.updates.check.mockResolvedValueOnce({ updateAvailable: true, required: true, policy });
    await render(
      <UpdateProvider>
        <UpdateProbe />
      </UpdateProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('required').children[0]).toBe('blocked'));
    mockApi.updates.check.mockRejectedValue(new ApiError('network', 0, 'NETWORK', 'offline'));
    await act(async () => {
      await fireEvent.press(screen.getByText('recheck'));
    });
    expect(screen.getByTestId('required').children[0]).toBe('blocked');
  });

  it('offers an optional update that can be dismissed with Not now', async () => {
    mockApi.updates.check.mockResolvedValue({ updateAvailable: true, required: false, policy });
    await render(
      <UpdateProvider>
        <UpdateProbe />
      </UpdateProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('optional').children[0]).toBe('2.0.0'));
    expect(screen.getByTestId('required').children[0]).toBe('open');
    await fireEvent.press(screen.getByText('dismiss'));
    await waitFor(() => expect(screen.getByTestId('optional').children[0]).toBe('none'));
  });
});
