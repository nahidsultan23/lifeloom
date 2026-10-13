// Public settings only. Everything in this file ships inside the app and is
// visible to the user. Secrets stay on the server.
//
// Empty strings are values the owner must supply. They are never guessed.

export type Variant = 'development' | 'staging' | 'production';

export interface AppConfig {
  variant: Variant;
  /** Includes the API prefix, for example https://host/api/v1 */
  apiBaseUrl: string;
  googleWebClientId: string;
  googleIosClientId: string;
  /** Reversed iOS client id, used as a URL scheme by the Google plugin. */
  googleIosUrlScheme: string;
  androidPackageId: string;
  iosBundleId: string;
  /** Numeric App Store id, or the identifier the server expects on iOS. */
  iosAppIdentifier: string;
  ads: {
    androidAppId: string;
    iosAppId: string;
    androidBannerUnitId: string;
    iosBannerUnitId: string;
    useTestUnits: boolean;
  };
  legal: { privacyPolicyUrl: string; termsUrl: string; supportUrl: string };
  features: { pushRegistration: boolean };
}

// Google publishes these ids for testing. They never serve real ads.
const GOOGLE_TEST_ADS = {
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  iosAppId: 'ca-app-pub-3940256099942544~1458002511',
  androidBannerUnitId: 'ca-app-pub-3940256099942544/9214589741',
  iosBannerUnitId: 'ca-app-pub-3940256099942544/2435281174',
};

const emptyAds = {
  androidAppId: '',
  iosAppId: '',
  androidBannerUnitId: '',
  iosBannerUnitId: '',
  useTestUnits: false,
};

const emptyLegal = { privacyPolicyUrl: '', termsUrl: '', supportUrl: '' };

export const environments: Record<Variant, AppConfig> = {
  development: {
    variant: 'development',
    // Android emulator: run `adb reverse tcp:3000 tcp:3000` so localhost works.
    apiBaseUrl: 'http://localhost:3000/api/v1',
    googleWebClientId: '',
    googleIosClientId: '',
    googleIosUrlScheme: '',
    androidPackageId: '',
    iosBundleId: '',
    iosAppIdentifier: '',
    ads: { ...GOOGLE_TEST_ADS, useTestUnits: true },
    legal: emptyLegal,
    features: { pushRegistration: true },
  },
  staging: {
    variant: 'staging',
    apiBaseUrl: '',
    googleWebClientId: '',
    googleIosClientId: '',
    googleIosUrlScheme: '',
    androidPackageId: '',
    iosBundleId: '',
    iosAppIdentifier: '',
    ads: { ...GOOGLE_TEST_ADS, useTestUnits: true },
    legal: emptyLegal,
    features: { pushRegistration: true },
  },
  production: {
    variant: 'production',
    apiBaseUrl: '',
    googleWebClientId: '',
    googleIosClientId: '',
    googleIosUrlScheme: '',
    androidPackageId: '',
    iosBundleId: '',
    iosAppIdentifier: '',
    ads: emptyAds,
    legal: emptyLegal,
    features: { pushRegistration: true },
  },
};

export function resolveVariant(value: string | undefined | null): Variant {
  return value === 'staging' || value === 'production' ? value : 'development';
}
