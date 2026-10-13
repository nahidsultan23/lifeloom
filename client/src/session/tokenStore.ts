import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Native sessions live in Keychain / Keystore. The browser preview has neither,
// so it uses localStorage. One module owns the cache on every platform.

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const TOKENS_KEY = 'lifeloom.session.v1';
const CONSENT_KEY = 'lifeloom.consent.v1';
const web = Platform.OS === 'web';

let cache: Tokens | null | undefined;

async function read(key: string): Promise<string | null> {
  try {
    if (web) return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  if (web) {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function remove(key: string): Promise<void> {
  try {
    if (web) localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    // The in-memory copy is already gone.
  }
}

export async function loadTokens(): Promise<Tokens | null> {
  if (cache !== undefined) return cache;
  const raw = await read(TOKENS_KEY);
  cache = raw ? (JSON.parse(raw) as Tokens) : null;
  return cache;
}

export async function saveTokens(tokens: Tokens): Promise<void> {
  cache = tokens;
  await write(TOKENS_KEY, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  cache = null;
  await remove(TOKENS_KEY);
}

export async function hasAcceptedConsent(): Promise<boolean> {
  return (await read(CONSENT_KEY)) === 'accepted';
}

export async function saveConsent(): Promise<void> {
  await write(CONSENT_KEY, 'accepted');
}
