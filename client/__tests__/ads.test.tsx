import { render, screen, waitFor } from '@testing-library/react-native';
import { AdBanner } from '../src/components/organisms/AdBanner';
import { AD_PLACEMENTS, buildAdRequestOptions, isAdPlacementAllowed } from '../src/lib/ads';

const FORBIDDEN = [
  'Welcome',
  'SignIn',
  'Onboarding',
  'GoalForm',
  'GoalDetail',
  'LetterForm',
  'LetterDetail',
  'Notifications',
  'Privacy',
  'Profile',
  'Home',
  'Goals',
  'Ledger',
  'Letters',
  'Snapshot',
  'MemoryForm',
  'WhatIfDetail',
  'RequiredUpdate',
];

describe('ad placement rules', () => {
  it('allows ads only on the About screen', async () => {
    expect([...AD_PLACEMENTS]).toEqual(['About']);
    expect(isAdPlacementAllowed('About')).toBe(true);
  });

  it.each(FORBIDDEN)('blocks ads on %s', (name) => {
    expect(isAdPlacementAllowed(name)).toBe(false);
  });

  it('sends the ad SDK only a fixed, non-personal request', async () => {
    expect(buildAdRequestOptions()).toEqual({ requestNonPersonalizedAdsOnly: true });
    expect(Object.keys(buildAdRequestOptions())).toEqual(['requestNonPersonalizedAdsOnly']);
  });
});

describe('AdBanner', () => {
  it('renders nothing for a blocked placement', async () => {
    await render(<AdBanner placement="GoalDetail" />);
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByTestId('banner-ad', { includeHiddenElements: true })).toBeNull();
  });

  it('renders on About and passes no personal content to the SDK', async () => {
    await render(<AdBanner placement="About" />);
    const banner = await waitFor(() => screen.getByTestId('banner-ad', { includeHiddenElements: true }));
    const props = banner.props as Record<string, unknown>;
    expect(Object.keys(props).filter((k) => !['testID', 'children', 'style'].includes(k)).sort()).toEqual(
      ['onAdFailedToLoad', 'requestOptions', 'size', 'unitId'].sort(),
    );
    expect(props.requestOptions).toEqual({ requestNonPersonalizedAdsOnly: true });
  });
});
