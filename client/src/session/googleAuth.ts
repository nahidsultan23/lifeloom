import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { config } from '../config';
import { t } from '../strings';

export type GoogleOutcome =
  | { kind: 'success'; idToken: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

let configured = false;

function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: config.googleWebClientId || undefined,
    iosClientId: config.googleIosClientId || undefined,
    scopes: ['email', 'profile'],
  });
  configured = true;
}

/** Official Google Sign-In. Returns the ID token for the server to verify. */
export async function signInWithGoogle(): Promise<GoogleOutcome> {
  if (!config.googleWebClientId) {
    return { kind: 'error', message: t.signIn.notConfigured };
  }
  try {
    ensureConfigured();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    if (result.type !== 'success') return { kind: 'cancelled' };
    const idToken = result.data.idToken;
    if (!idToken) return { kind: 'error', message: t.signIn.failed };
    return { kind: 'success', idToken };
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code === statusCodes.SIGN_IN_CANCELLED) return { kind: 'cancelled' };
    if (code === statusCodes.IN_PROGRESS) return { kind: 'cancelled' };
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { kind: 'error', message: t.signIn.playServices };
    }
    return { kind: 'error', message: t.signIn.failed };
  }
}

export async function signOutOfGoogle(): Promise<void> {
  try {
    ensureConfigured();
    await GoogleSignin.signOut();
  } catch {
    // The Lifeloom session is cleared either way.
  }
}
