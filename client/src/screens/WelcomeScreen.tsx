import { useEffect, useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { config } from '../config';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { Notice } from '../components/molecules/Notice';
import { ToggleRow } from '../components/molecules/ToggleRow';
import { ScreenTemplate } from '../components/templates/ScreenTemplate';
import { hasAcceptedConsent, saveConsent } from '../session/tokenStore';
import { useAuth } from '../state/AuthContext';
import { t } from '../strings';
import { spacing } from '../theme';

/** First screen. No ads here, by rule. */
export function WelcomeScreen() {
  const { signIn, sessionNotice } = useAuth();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    void hasAcceptedConsent().then(setConsent);
  }, []);

  const start = async () => {
    setBusy(true);
    setMessage(undefined);
    await saveConsent();
    const result = await signIn();
    // On success the navigator swaps screens, so only failures stay here.
    if (!result.ok) {
      setBusy(false);
      if (!result.cancelled) setMessage(result.message);
    }
  };

  const { privacyPolicyUrl, termsUrl } = config.legal;
  const hasLegal = !!privacyPolicyUrl || !!termsUrl;

  return (
    <ScreenTemplate edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.hero}>
        <Image
          source={require('../../assets/branding/logo-symbol.png')}
          style={styles.logo}
          accessibilityLabel={t.app.logoLabel}
        />
        <AppText variant="display" style={styles.center}>
          {t.app.name}
        </AppText>
        <AppText variant="heading" muted style={styles.center}>
          {t.app.philosophy}
        </AppText>
        <AppText muted style={styles.center}>
          {t.welcome.intro}
        </AppText>
      </View>

      {sessionNotice ? <Notice icon="log-out" message={sessionNotice} /> : null}
      {message ? <Notice icon="alert-circle" message={message} /> : null}

      <View style={styles.consent}>
        <ToggleRow label={t.welcome.consentLabel} description={t.welcome.consentBody} value={consent} onChange={setConsent} />
        {hasLegal ? (
          <View style={styles.links}>
            {privacyPolicyUrl ? (
              <Button label={t.welcome.privacyPolicy} variant="quiet" icon="external-link" onPress={() => void Linking.openURL(privacyPolicyUrl)} />
            ) : null}
            {termsUrl ? (
              <Button label={t.welcome.terms} variant="quiet" icon="external-link" onPress={() => void Linking.openURL(termsUrl)} />
            ) : null}
          </View>
        ) : (
          <AppText variant="caption" muted>
            {t.welcome.legalPending}
          </AppText>
        )}
      </View>

      <Button
        label={t.welcome.signIn}
        icon="log-in"
        onPress={start}
        loading={busy}
        disabled={!consent}
        accessibilityHint={consent ? undefined : t.welcome.consentRequiredHint}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl },
  logo: { width: 112, height: 112, borderRadius: 28 },
  center: { textAlign: 'center' },
  consent: { gap: spacing.sm },
  links: { flexDirection: 'row', flexWrap: 'wrap' },
});
