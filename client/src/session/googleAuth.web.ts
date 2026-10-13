import { t } from '../strings';

export type GoogleOutcome =
  | { kind: 'success'; idToken: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

/** Google Sign-In is a native module. The browser preview cannot complete it. */
export async function signInWithGoogle(): Promise<GoogleOutcome> {
  return { kind: 'error', message: t.signIn.webUnavailable };
}

export async function signOutOfGoogle(): Promise<void> {}
