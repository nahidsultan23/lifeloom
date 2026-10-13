import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { AdBanner } from '../components/organisms/AdBanner';
import { ScreenTemplate } from '../components/templates/ScreenTemplate';
import { appIdentity, config } from '../config';
import { adPrivacyOptionsRequired, showAdPrivacyOptions } from '../lib/ads';
import { t } from '../strings';

/** The only screen with an ad. It shows no personal content and has no form. */
export function AboutScreen() {
  const id = appIdentity();
  const [adChoices, setAdChoices] = useState(false);
  useEffect(() => {
    void adPrivacyOptionsRequired().then(setAdChoices);
  }, []);

  const { privacyPolicyUrl, termsUrl } = config.legal;
  return (
    <ScreenTemplate>
      <AppText variant="title">{t.app.name}</AppText>
      <AppText muted>{t.app.philosophy}</AppText>
      <AppText>{t.about.version(id.version, id.build)}</AppText>
      {privacyPolicyUrl ? <Button label={t.welcome.privacyPolicy} variant="secondary" icon="external-link" onPress={() => void Linking.openURL(privacyPolicyUrl)} /> : null}
      {termsUrl ? <Button label={t.welcome.terms} variant="secondary" icon="external-link" onPress={() => void Linking.openURL(termsUrl)} /> : null}
      {adChoices ? <Button label={t.about.adChoices} variant="secondary" icon="sliders" onPress={() => void showAdPrivacyOptions()} /> : null}
      <AppText variant="caption" muted>
        {t.about.adsNote}
      </AppText>
      <AdBanner placement="About" />
    </ScreenTemplate>
  );
}
