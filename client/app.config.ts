import type { ExpoConfig } from 'expo/config';
import { environments, resolveVariant } from './src/config/environments.ts';

// APP_VARIANT picks which config object the build uses:
// development (default), staging or production. See docs/config.md.
const variant = resolveVariant(process.env.APP_VARIANT);
const env = environments[variant];

const plugins: NonNullable<ExpoConfig['plugins']> = [
  'expo-secure-store',
  'expo-asset',
  'expo-font',
  '@react-native-community/datetimepicker',
  [
    'expo-image-picker',
    {
      photosPermission:
        'Lifeloom uses your photos only when you choose one to attach.',
      cameraPermission: false,
      microphonePermission: false,
    },
  ],
  ['expo-audio', { microphonePermission: false }],
  [
    'expo-notifications',
    { color: '#1B2A49', defaultChannel: 'reminders' },
  ],
  [
    'expo-build-properties',
    { android: { usesCleartextTraffic: variant === 'development' } },
  ],
  env.googleIosUrlScheme
    ? [
        '@react-native-google-signin/google-signin',
        { iosUrlScheme: env.googleIosUrlScheme },
      ]
    : '@react-native-google-signin/google-signin',
];

if (env.ads.androidAppId && env.ads.iosAppId) {
  plugins.push([
    'react-native-google-mobile-ads',
    {
      androidAppId: env.ads.androidAppId,
      iosAppId: env.ads.iosAppId,
      userTrackingPermission:
        'This lets Lifeloom show ads that are less irrelevant to you. Nothing you write in the app is shared.',
    },
  ]);
}

const config: ExpoConfig = {
  name: variant === 'production' ? 'Lifeloom' : `Lifeloom (${variant})`,
  slug: 'lifeloom',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'lifeloom',
  icon: './assets/branding/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/branding/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F6F1E7',
  },
  ios: {
    supportsTablet: true,
    buildNumber: '1',
    ...(env.iosBundleId ? { bundleIdentifier: env.iosBundleId } : {}),
  },
  android: {
    versionCode: 1,
    ...(env.androidPackageId ? { package: env.androidPackageId } : {}),
    adaptiveIcon: {
      foregroundImage: './assets/branding/adaptive-icon.png',
      backgroundColor: '#1B2A49',
    },
    permissions: ['POST_NOTIFICATIONS'],
  },
  plugins,
  extra: { variant },
};

export default config;
