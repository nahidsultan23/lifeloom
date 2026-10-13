import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { environments, resolveVariant, type AppConfig } from './environments';

const variant = resolveVariant(
  (Constants.expoConfig?.extra as { variant?: string } | undefined)?.variant,
);

export const config: AppConfig = environments[variant];

export const platform: 'android' | 'ios' =
  Platform.OS === 'ios' ? 'ios' : 'android';

/** Identity the server expects in app-update checks and headers. */
export function appIdentity() {
  const build = Number(Application.nativeBuildVersion);
  const configured =
    (platform === 'android' ? config.androidPackageId : config.iosAppIdentifier) ||
    Application.applicationId ||
    '';
  return {
    platform,
    version: Application.nativeApplicationVersion ?? '0.1.0',
    build: Number.isInteger(build) && build > 0 ? build : 1,
    // A production build must use the real store id. Local builds may not have one yet.
    appIdentifier: configured || (config.variant === 'production' ? '' : 'development'),
  };
}

export const isApiConfigured = config.apiBaseUrl.length > 0;
