import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { api, ApiError, type Profile } from '../api';
import { deviceTimeZone } from '../lib/dates';
import { registerDeviceIfPossible, unregisterDevice } from '../lib/notifications';
import { sessionExpired } from '../session/events';
import { signInWithGoogle, signOutOfGoogle } from '../session/googleAuth';
import { clearTokens, loadTokens, saveTokens } from '../session/tokenStore';
import { t } from '../strings';

type Status = 'loading' | 'signedOut' | 'signedIn';

export type SignInResult =
  | { ok: true }
  | { ok: false; cancelled: boolean; message: string };

interface AuthValue {
  status: Status;
  profile: Profile | undefined;
  /** Shown once on the welcome screen after a session ends on its own. */
  sessionNotice: string | undefined;
  signIn(): Promise<SignInResult>;
  signOut(): Promise<void>;
  reloadProfile(): Promise<void>;
  setProfile(profile: Profile): void;
  /** Called after the account is deleted on the server. */
  endSession(): Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [profile, setProfile] = useState<Profile | undefined>();
  const [sessionNotice, setSessionNotice] = useState<string | undefined>();
  const deviceToken = useRef<string | null>(null);

  const afterSignIn = useCallback(async () => {
    const loaded = await api.profile.get();
    setProfile(loaded);
    setStatus('signedIn');
    // Keep the server copy of the time zone current for later devices.
    const zone = deviceTimeZone();
    if (loaded.timeZone !== zone) {
      api.profile
        .update({ timeZone: zone })
        .then(setProfile)
        .catch(() => undefined);
    }
    deviceToken.current = await registerDeviceIfPossible();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokens = await loadTokens();
      if (!tokens) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      try {
        await afterSignIn();
      } catch (error) {
        if (cancelled) return;
        // Offline at launch keeps the saved session. The Home screen shows
        // its own retry state. A rejected session was already cleared.
        if (error instanceof ApiError && error.isOffline) {
          setStatus('signedIn');
        } else {
          setStatus('signedOut');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [afterSignIn]);

  useEffect(
    () =>
      sessionExpired.subscribe(() => {
        setProfile(undefined);
        setSessionNotice(t.signIn.sessionEnded);
        setStatus('signedOut');
      }),
    [],
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && status === 'signedIn') {
        void registerDeviceIfPossible().then((token) => {
          if (token) deviceToken.current = token;
        });
      }
    });
    return () => sub.remove();
  }, [status]);

  const signIn = useCallback(async (): Promise<SignInResult> => {
    const google = await signInWithGoogle();
    if (google.kind === 'cancelled') return { ok: false, cancelled: true, message: '' };
    if (google.kind === 'error') return { ok: false, cancelled: false, message: google.message };
    try {
      const result = await api.auth.google(google.idToken);
      await saveTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      setSessionNotice(undefined);
      await afterSignIn();
      return { ok: true };
    } catch (error) {
      await clearTokens();
      const message =
        error instanceof ApiError && error.code === 'INVALID_GOOGLE_TOKEN'
          ? t.signIn.invalidToken
          : error instanceof ApiError
            ? error.message
            : t.errors.generic;
      return { ok: false, cancelled: false, message };
    }
  }, [afterSignIn]);

  const endSession = useCallback(async () => {
    await signOutOfGoogle();
    await clearTokens();
    deviceToken.current = null;
    setProfile(undefined);
    setSessionNotice(undefined);
    setStatus('signedOut');
  }, []);

  const signOut = useCallback(async () => {
    await unregisterDevice(deviceToken.current);
    try {
      await api.auth.logout();
    } catch {
      // The server session expires on its own. Local sign-out still happens.
    }
    await endSession();
  }, [endSession]);

  const reloadProfile = useCallback(async () => {
    setProfile(await api.profile.get());
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      profile,
      sessionNotice,
      signIn,
      signOut,
      reloadProfile,
      setProfile,
      endSession,
    }),
    [status, profile, sessionNotice, signIn, signOut, reloadProfile, endSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
