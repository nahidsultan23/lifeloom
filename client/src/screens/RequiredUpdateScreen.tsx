import { BackHandler, Image, StyleSheet, View } from 'react-native';
import { openSafeUrl } from '../lib/links';
import { useEffect } from 'react';
import type { UpdatePolicy } from '../api';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { ScreenTemplate } from '../components/templates/ScreenTemplate';
import { appIdentity } from '../config';
import { t } from '../strings';
import { spacing } from '../theme';

/**
 * Shown instead of the app when this version is unsupported. There is no
 * dismiss and the back button does nothing. Opening the store does not mean
 * the update was installed, so the screen stays until a new check passes.
 */
export function RequiredUpdateScreen({ policy, onRecheck }: { policy: UpdatePolicy; onRecheck: () => void }) {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);
  const { version } = appIdentity();

  return (
    <ScreenTemplate edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.hero}>
        <Image source={require('../../assets/branding/logo-symbol.png')} style={styles.logo} accessibilityLabel={t.app.logoLabel} />
        <AppText variant="title" style={styles.center}>
          {t.updates.requiredTitle}
        </AppText>
        <AppText style={styles.center}>{t.updates.requiredBody(version, policy.minimumVersion)}</AppText>
        {policy.releaseNotes.length ? (
          <View style={styles.notes}>
            {policy.releaseNotes.map((note, i) => (
              <AppText key={i} muted>
                • {note}
              </AppText>
            ))}
          </View>
        ) : null}
      </View>
      <Button label={t.updates.update} icon="download" onPress={() => void openSafeUrl(policy.storeUrl)} />
      <Button label={t.updates.checkAgain} variant="secondary" icon="refresh-cw" onPress={onRecheck} />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl },
  logo: { width: 96, height: 96, borderRadius: 24 },
  center: { textAlign: 'center' },
  notes: { alignSelf: 'stretch', gap: spacing.xs },
});
