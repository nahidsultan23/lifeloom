import { Linking } from 'react-native';

const ALLOWED = /^(https:\/\/|market:\/\/|itms-apps:\/\/)/i;

/** Opens a link only if it uses a store or secure web scheme. Server values are not trusted blindly. */
export async function openSafeUrl(url: string): Promise<boolean> {
  if (!ALLOWED.test(url)) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
