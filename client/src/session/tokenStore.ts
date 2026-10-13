import * as SecureStore from 'expo-secure-store';

// Session tokens live in platform secure storage (Keychain / Keystore),
// never in AsyncStorage.

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const TOKENS_KEY = 'lifeloom.session.v1';
const CONSENT_KEY = 'lifeloom.consent.v1';

let cache: Tokens | null | undefined;

export async function loadTokens(): Promise<Tokens | null> {
  if (cache !== undefined) return cache;
  try {
    const raw = await SecureStore.getItemAsync(TOKENS_KEY);
    cache = raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    cache = null;
  }
  return cache;
}

export async function saveTokens(tokens: Tokens): Promise<void> {
  cache = tokens;
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  cache = null;
  try {
    await SecureStore.deleteItemAsync(TOKENS_KEY);
  } catch {
    // Nothing else to do. The in-memory copy is already gone.
  }
}

export async function hasAcceptedConsent(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(CONSENT_KEY)) === 'accepted';
  } catch {
    return false;
  }
}

export async function saveConsent(): Promise<void> {
  await SecureStore.setItemAsync(CONSENT_KEY, 'accepted');
}
