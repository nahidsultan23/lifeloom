import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api, type UpdatePolicy } from '../api';
import { appIdentity } from '../config';
import { updateRequired } from '../session/events';

const REQUIRED_KEY = 'lifeloom.update.required.v1';

interface UpdateValue {
  /** Set when this version is unsupported. Navigation is blocked. */
  required: UpdatePolicy | null;
  /** Set when a newer version exists and the user has not said "Not now". */
  optional: UpdatePolicy | null;
  dismissOptional(): void;
  recheck(): Promise<void>;
}

const UpdateContext = createContext<UpdateValue | null>(null);

export function useUpdates(): UpdateValue {
  const value = useContext(UpdateContext);
  if (!value) throw new Error('useUpdates must be used inside UpdateProvider');
  return value;
}

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [required, setRequired] = useState<UpdatePolicy | null>(null);
  const [optional, setOptional] = useState<UpdatePolicy | null>(null);
  const [dismissedVersion, setDismissedVersion] = useState<number | null>(null);

  const recheck = useCallback(async () => {
    try {
      const result = await api.updates.check(appIdentity());
      if (result.required && result.policy) {
        setRequired(result.policy);
        await SecureStore.setItemAsync(REQUIRED_KEY, JSON.stringify(result.policy));
        return;
      }
      // The server says this version is supported again.
      setRequired(null);
      await SecureStore.deleteItemAsync(REQUIRED_KEY).catch(() => undefined);
      setOptional(result.updateAvailable ? result.policy : null);
    } catch {
      // A failed check never locks the app. A block that is already known
      // stays in place, because `required` is left untouched here.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(REQUIRED_KEY);
        if (raw && !cancelled) setRequired(JSON.parse(raw) as UpdatePolicy);
      } catch {
        // No stored policy.
      }
      if (!cancelled) await recheck();
    })();
    return () => {
      cancelled = true;
    };
  }, [recheck]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void recheck();
    });
    return () => sub.remove();
  }, [recheck]);

  // A protected API said the version is unsupported before we knew it.
  useEffect(() => updateRequired.subscribe(() => void recheck()), [recheck]);

  const value = useMemo<UpdateValue>(
    () => ({
      required,
      optional:
        optional && optional.policyVersion !== dismissedVersion ? optional : null,
      dismissOptional: () => setDismissedVersion(optional?.policyVersion ?? null),
      recheck,
    }),
    [required, optional, dismissedVersion, recheck],
  );

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}
