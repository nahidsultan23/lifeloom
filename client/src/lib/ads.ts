import { Platform } from 'react-native';
import mobileAds, { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } from 'react-native-google-mobile-ads';
import { config } from '../config';

/**
 * Places where an ad may appear. Everything else is blocked: onboarding,
 * sign-in, goal edit, letter compose or view, notification open, forms,
 * confirmations, errors, and any screen that shows personal content.
 */
export const AD_PLACEMENTS = ['About'] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export function isAdPlacementAllowed(name: string): name is AdPlacement {
  return (AD_PLACEMENTS as readonly string[]).includes(name);
}

/**
 * The only data handed to the ad SDK with a request. It is a fixed object and
 * never contains goals, letters, timeline text, a birth date, or a lifespan.
 */
export function buildAdRequestOptions() {
  return { requestNonPersonalizedAdsOnly: true } as const;
}

export function bannerUnitId(): string | null {
  const id =
    Platform.OS === 'ios' ? config.ads.iosBannerUnitId : config.ads.androidBannerUnitId;
  return id || null;
}

let initialised: Promise<boolean> | null = null;

/** Gathers consent, then starts the SDK only if the user can be shown ads. */
export function initAdsWithConsent(): Promise<boolean> {
  if (!initialised) {
    initialised = (async () => {
      try {
        const info = await AdsConsent.gatherConsent();
        if (!info.canRequestAds) return false;
        await mobileAds().initialize();
        return true;
      } catch {
        // An ad failure never blocks the app.
        return false;
      }
    })();
  }
  return initialised;
}

export async function adPrivacyOptionsRequired(): Promise<boolean> {
  try {
    const info = await AdsConsent.gatherConsent();
    return (
      info.privacyOptionsRequirementStatus ===
      AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
    );
  } catch {
    return false;
  }
}

export async function showAdPrivacyOptions(): Promise<void> {
  try {
    await AdsConsent.showPrivacyOptionsForm();
    initialised = null;
  } catch {
    // Nothing to show.
  }
}
