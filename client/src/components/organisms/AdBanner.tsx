import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { config } from '../../config';
import {
  bannerUnitId,
  buildAdRequestOptions,
  initAdsWithConsent,
  isAdPlacementAllowed,
} from '../../lib/ads';
import { spacing } from '../../theme';

interface Props {
  /** Must be an allowed placement. The component takes no other input, so no
   * personal content can reach the ad SDK through it. */
  placement: string;
}

export function AdBanner({ placement }: Props) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const allowed = isAdPlacementAllowed(placement);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    void initAdsWithConsent().then((ok) => {
      if (!cancelled) setReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  const unit = config.ads.useTestUnits ? TestIds.ADAPTIVE_BANNER : bannerUnitId();
  if (!allowed || !ready || failed || !unit) return null;

  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <BannerAd
        unitId={unit}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={buildAdRequestOptions()}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.sm },
});
