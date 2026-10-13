export const AD_PLACEMENTS = ['About'] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export function isAdPlacementAllowed(name: string): name is AdPlacement {
  return (AD_PLACEMENTS as readonly string[]).includes(name);
}

export function buildAdRequestOptions() {
  return { requestNonPersonalizedAdsOnly: true } as const;
}

export function bannerUnitId(): string | null {
  return null;
}

export function initAdsWithConsent(): Promise<boolean> {
  return Promise.resolve(false);
}

export async function adPrivacyOptionsRequired(): Promise<boolean> {
  return false;
}

export async function showAdPrivacyOptions(): Promise<void> {}
