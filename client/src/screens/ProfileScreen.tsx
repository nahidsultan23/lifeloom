import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { View } from 'react-native';
import { api } from '../api';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { DateField } from '../components/molecules/DateField';
import { Notice } from '../components/molecules/Notice';
import { TextField } from '../components/molecules/TextField';
import { AttachmentSection } from '../components/organisms/AttachmentSection';
import { ScreenTemplate } from '../components/templates/ScreenTemplate';
import { deviceTimeZone } from '../lib/dates';
import { clearField, toFormFailure } from '../lib/fieldErrors';
import { LIMITS } from '../lib/limits';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { t } from '../strings';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, setProfile, reloadProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? '');
  const [birth, setBirth] = useState(profile?.birthDate ?? '');
  const [lifespan, setLifespan] = useState(profile?.expectedLifespanYears ? String(profile.expectedLifespanYears) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!profile) return null;

  const touch = (key: string) => {
    setErrors((e) => clearField(e, key));
    setFormError(undefined);
    setSaved(false);
  };

  const save = async () => {
    const local: Record<string, string> = {};
    if (!name.trim()) local.displayName = t.profile.errors.nameRequired;
    if (!birth) local.birthDate = t.profile.errors.birthRequired;
    if (lifespan) {
      const years = Number(lifespan);
      if (!Number.isInteger(years) || years < LIMITS.lifespanMin || years > LIMITS.lifespanMax) {
        local.expectedLifespanYears = t.profile.errors.lifespanRange(LIMITS.lifespanMin, LIMITS.lifespanMax);
      }
    }
    if (Object.keys(local).length) {
      setErrors(local);
      setFormError(t.common.checkHighlighted);
      return;
    }
    setSaving(true);
    setErrors({});
    setFormError(undefined);
    try {
      const updated = await api.profile.update({
        displayName: name.trim(),
        birthDate: birth,
        // null removes the optional lifespan.
        expectedLifespanYears: lifespan ? Number(lifespan) : null,
      });
      setProfile(updated);
      setSaved(true);
    } catch (e) {
      const failure = toFormFailure(e);
      setErrors(failure.fields);
      setFormError(failure.message);
    } finally {
      setSaving(false);
    }
  };

  const zone = deviceTimeZone();

  return (
    <ScreenTemplate>
      <AppText variant="title">{t.profile.title}</AppText>

      <AttachmentSection
        purpose="avatar"
        parentId="me"
        attachmentIds={profile.avatarUploadId ? [profile.avatarUploadId] : []}
        onChanged={() => void reloadProfile()}
      />

      <TextField
        label={t.profile.fields.name}
        value={name}
        onChangeText={(v) => {
          setName(v);
          touch('displayName');
        }}
        maxLength={LIMITS.displayName}
        error={errors.displayName}
      />
      <DateField
        label={t.profile.fields.birthDate}
        value={birth}
        maximumDate={new Date()}
        onChange={(v) => {
          setBirth(v);
          touch('birthDate');
        }}
        error={errors.birthDate}
      />
      <TextField
        label={t.profile.fields.lifespan}
        value={lifespan}
        onChangeText={(v) => {
          setLifespan(v.replace(/[^0-9]/g, ''));
          touch('expectedLifespanYears');
        }}
        keyboardType="number-pad"
        maxLength={3}
        optional
        helper={t.profile.lifespanHelper}
        error={errors.expectedLifespanYears}
      />
      {lifespan ? (
        <Button
          label={t.profile.removeLifespan}
          variant="quiet"
          icon="x"
          onPress={() => {
            setLifespan('');
            touch('expectedLifespanYears');
          }}
        />
      ) : null}

      {formError ? <Notice icon="alert-circle" message={formError} /> : null}
      {saved ? <Notice icon="check" message={t.common.saved} /> : null}
      <Button label={t.common.saveChanges} onPress={save} loading={saving} />

      <Card>
        <AppText variant="label">{t.profile.fields.email}</AppText>
        <AppText>{profile.email}</AppText>
        <AppText variant="caption" muted>
          {profile.emailVerified ? t.profile.emailVerified : t.profile.emailUnverified}
        </AppText>
      </Card>
      <Card>
        <AppText variant="label">{t.profile.fields.timeZone}</AppText>
        <AppText>{profile.timeZone}</AppText>
        {profile.timeZone !== zone ? (
          <Button
            label={t.profile.useDeviceZone(zone)}
            variant="secondary"
            onPress={async () => {
              try {
                setProfile(await api.profile.update({ timeZone: zone }));
              } catch (e) {
                setFormError(toFormFailure(e).message);
              }
            }}
          />
        ) : (
          <AppText variant="caption" muted>
            {t.profile.zoneMatches}
          </AppText>
        )}
      </Card>

      <View style={{ gap: 8 }}>
        <Button label={t.profile.notifications} icon="bell" variant="secondary" onPress={() => navigation.navigate('Notifications')} />
        <Button label={t.profile.privacy} icon="shield" variant="secondary" onPress={() => navigation.navigate('Privacy')} />
        <Button label={t.profile.about} icon="info" variant="secondary" onPress={() => navigation.navigate('About')} />
        <Button
          label={t.profile.signOut}
          icon="log-out"
          variant="quiet"
          loading={signingOut}
          onPress={async () => {
            setSigningOut(true);
            await signOut();
          }}
        />
        <AppText variant="caption" muted>
          {t.profile.signOutNote}
        </AppText>
      </View>
    </ScreenTemplate>
  );
}
