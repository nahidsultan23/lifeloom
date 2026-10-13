import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { api, type Letter, type LetterInput } from '../api';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { Pill } from '../components/atoms/Pill';
import { ChoiceRow } from '../components/molecules/ChoiceRow';
import { ConfirmDialog } from '../components/molecules/ConfirmDialog';
import { DateField } from '../components/molecules/DateField';
import { Notice } from '../components/molecules/Notice';
import { EmptyState } from '../components/molecules/StateViews';
import { TextField } from '../components/molecules/TextField';
import { ToggleRow } from '../components/molecules/ToggleRow';
import { AttachmentSection } from '../components/organisms/AttachmentSection';
import { FormTemplate } from '../components/templates/FormTemplate';
import { ResourceView, ScreenTemplate } from '../components/templates/ScreenTemplate';
import { addYears, daysBetween, formatDateOnly, formatInstant, isValidDateOnly, localToday } from '../lib/dates';
import { clearField, toFormFailure } from '../lib/fieldErrors';
import { LIMITS } from '../lib/limits';
import type { RootStackParamList, ScreenProps } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useResource } from '../state/useResource';
import { t } from '../strings';

function whenLabel(letter: Letter): string {
  return letter.deliveryType === 'date' && letter.deliveryDate
    ? formatDateOnly(letter.deliveryDate)
    : formatInstant(letter.scheduledAt);
}

function statusPill(status: Letter['status']) {
  const icon =
    status === 'delivered' ? 'check' : status === 'cancelled' ? 'slash' : status === 'failed' ? 'alert-circle' : 'clock';
  return <Pill label={t.letters.status[status]} icon={icon} tone={status === 'failed' ? 'notice' : 'neutral'} />;
}

export function LettersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const letters = useResource((signal) => api.letters.list({ signal }), []);
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else letters.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <ScreenTemplate onRefresh={letters.reload} refreshing={letters.loading && letters.data !== undefined}>
      <AppText muted>{t.letters.intro}</AppText>
      <Button label={t.letters.write} icon="edit-3" onPress={() => navigation.navigate('LetterForm')} />
      <ResourceView {...letters}>
        {(items) =>
          items.length === 0 ? (
            <EmptyState icon="mail" title={t.letters.emptyTitle} body={t.letters.emptyBody} />
          ) : (
            <View style={{ gap: 12 }}>
              {items.map((letter) => (
                <Card
                  key={letter._id}
                  onPress={() => navigation.navigate('LetterDetail', { letterId: letter._id })}
                  accessibilityLabel={`${t.letters.letterFor(whenLabel(letter))}. ${t.letters.status[letter.status]}`}
                >
                  <AppText variant="heading">{t.letters.letterFor(whenLabel(letter))}</AppText>
                  {statusPill(letter.status)}
                </Card>
              ))}
            </View>
          )
        }
      </ResourceView>
    </ScreenTemplate>
  );
}

export function validateLetter(
  v: { body: string; deliveryType: 'date' | 'age'; deliveryDate: string; targetAge: string },
  birthDate: string | undefined,
  today: string = localToday(),
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!v.body.trim()) errors.body = t.letters.errors.bodyRequired;
  if (v.deliveryType === 'date') {
    if (!isValidDateOnly(v.deliveryDate)) errors.deliveryDate = t.letters.errors.dateRequired;
    else if ((daysBetween(today, v.deliveryDate) ?? 0) <= 0) errors.deliveryDate = t.letters.errors.dateFuture;
  } else {
    const age = Number(v.targetAge);
    if (!Number.isInteger(age) || age < 1 || age > LIMITS.targetAgeMax) {
      errors.targetAge = t.goals.errors.ageRange(LIMITS.targetAgeMax);
    } else if (!birthDate) {
      errors.targetAge = t.letters.errors.birthDateNeeded;
    } else {
      const date = addYears(birthDate, age);
      if (!date || (daysBetween(today, date) ?? 0) <= 0) errors.targetAge = t.letters.errors.dateFuture;
    }
  }
  return errors;
}

function LetterForm({ letter, navigation }: { letter?: Letter; navigation: ScreenProps<'LetterForm'>['navigation'] }) {
  const { profile } = useAuth();
  const [body, setBody] = useState(letter?.body ?? '');
  const [deliveryType, setDeliveryType] = useState<'date' | 'age'>(letter?.deliveryType ?? 'date');
  const [deliveryDate, setDeliveryDate] = useState(letter?.deliveryDate ?? '');
  const [targetAge, setTargetAge] = useState(letter?.targetAge ? String(letter.targetAge) : '');
  const [emailEnabled, setEmailEnabled] = useState(letter?.emailEnabled ?? true);
  const [inAppEnabled, setInAppEnabled] = useState(letter?.inAppEnabled ?? true);
  const [previewing, setPreviewing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const touch = (key: string) => {
    setErrors((e) => clearField(e, key));
    setFormError(undefined);
  };

  const submit = async () => {
    const local = validateLetter({ body, deliveryType, deliveryDate, targetAge }, profile?.birthDate);
    if (Object.keys(local).length) {
      setErrors(local);
      setFormError(t.common.checkHighlighted);
      return;
    }
    setSubmitting(true);
    setErrors({});
    setFormError(undefined);
    const input: LetterInput = {
      body: body.trim(),
      deliveryType,
      emailEnabled,
      inAppEnabled,
      ...(deliveryType === 'date' ? { deliveryDate } : { targetAge: Number(targetAge) }),
    };
    try {
      const saved = letter ? await api.letters.update(letter._id, input) : await api.letters.create(input);
      navigation.replace('LetterDetail', { letterId: saved._id });
    } catch (e) {
      const failure = toFormFailure(e);
      setErrors(failure.fields);
      setFormError(failure.message);
      setSubmitting(false);
    }
  };

  return (
    <FormTemplate
      submitLabel={letter ? t.common.saveChanges : t.letters.schedule}
      submitting={submitting}
      onSubmit={submit}
      error={formError}
      footerExtra={<Button label={previewing ? t.letters.hidePreview : t.letters.preview} variant="secondary" icon="eye" onPress={() => setPreviewing((p) => !p)} />}
    >
      <TextField
        label={t.letters.fields.body}
        value={body}
        onChangeText={(v) => {
          setBody(v);
          touch('body');
        }}
        maxLength={LIMITS.letterBody}
        multiline
        error={errors.body}
      />
      {previewing ? (
        <Card accessibilityLabel={t.letters.preview}>
          <AppText variant="label">{t.letters.preview}</AppText>
          <AppText>{body.trim() || t.letters.previewEmpty}</AppText>
        </Card>
      ) : null}
      <ChoiceRow
        label={t.letters.fields.deliveryType}
        value={deliveryType}
        options={[
          { value: 'date', label: t.letters.deliveryTypes.date },
          { value: 'age', label: t.letters.deliveryTypes.age },
        ]}
        onChange={(v) => {
          setDeliveryType(v);
          touch('deliveryDate');
          touch('targetAge');
        }}
      />
      {deliveryType === 'date' ? (
        <DateField
          label={t.letters.fields.deliveryDate}
          value={deliveryDate}
          minimumDate={new Date(Date.now() + 86400000)}
          onChange={(v) => {
            setDeliveryDate(v);
            touch('deliveryDate');
          }}
          error={errors.deliveryDate}
        />
      ) : (
        <TextField
          label={t.letters.fields.targetAge}
          value={targetAge}
          onChangeText={(v) => {
            setTargetAge(v.replace(/[^0-9]/g, ''));
            touch('targetAge');
          }}
          keyboardType="number-pad"
          maxLength={3}
          error={errors.targetAge}
          helper={profile?.birthDate ? undefined : t.letters.errors.birthDateNeeded}
        />
      )}
      <ToggleRow label={t.letters.fields.inApp} value={inAppEnabled} onChange={setInAppEnabled} />
      <ToggleRow
        label={t.letters.fields.email}
        description={t.letters.emailNote(profile?.email ?? '')}
        value={emailEnabled}
        onChange={setEmailEnabled}
      />
      <Notice icon="info" message={t.letters.bestEffort} />
      <AppText variant="caption" muted>
        {t.letters.attachAfterSave}
      </AppText>
    </FormTemplate>
  );
}

export function LetterFormScreen({ route, navigation }: ScreenProps<'LetterForm'>) {
  const letterId = route.params?.letterId;
  const letter = useResource((signal) => (letterId ? api.letters.get(letterId, { signal }) : Promise.resolve(undefined)), [letterId]);
  if (!letterId) return <LetterForm navigation={navigation} />;
  if (letter.data) return <LetterForm letter={letter.data} navigation={navigation} />;
  return (
    <ScreenTemplate scroll={false}>
      <ResourceView {...letter}>{() => null}</ResourceView>
    </ScreenTemplate>
  );
}

export function LetterDetailScreen({ route, navigation }: ScreenProps<'LetterDetail'>) {
  const { letterId } = route.params;
  const letter = useResource((signal) => api.letters.get(letterId, { signal }), [letterId]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else letter.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const cancel = async () => {
    setBusy(true);
    try {
      await api.letters.cancel(letterId);
      setConfirm(false);
      letter.reload();
    } catch (e) {
      setError(toFormFailure(e).message);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenTemplate onRefresh={letter.reload} refreshing={letter.loading && letter.data !== undefined}>
      <ResourceView {...letter}>
        {(l) => {
          const scheduled = l.status === 'scheduled';
          return (
            <>
              <AppText variant="title">{t.letters.letterFor(whenLabel(l))}</AppText>
              {statusPill(l.status)}
              {error ? <Notice icon="alert-circle" message={error} /> : null}
              <AppText muted>{t.letters.deliveryVia(l.inAppEnabled, l.emailEnabled)}</AppText>
              {l.deliveredAt ? <AppText muted>{t.letters.deliveredOn(formatInstant(l.deliveredAt))}</AppText> : null}
              {l.status === 'failed' ? <Notice icon="info" message={t.letters.failedNote} /> : null}
              <Card>
                <AppText>{l.body}</AppText>
              </Card>
              <AttachmentSection purpose="letter" parentId={l._id} attachmentIds={l.attachmentIds ?? []} onChanged={letter.reload} editable={scheduled} />
              <Notice icon="info" message={t.letters.bestEffort} />
              {scheduled ? (
                <>
                  <Button label={t.letters.editOrReschedule} icon="edit-2" variant="secondary" onPress={() => navigation.navigate('LetterForm', { letterId })} />
                  <Button label={t.letters.cancel} icon="slash" variant="quiet" onPress={() => setConfirm(true)} />
                </>
              ) : null}
            </>
          );
        }}
      </ResourceView>
      <ConfirmDialog
        visible={confirm}
        title={t.letters.cancelTitle}
        body={t.letters.cancelBody}
        confirmLabel={t.letters.cancel}
        busy={busy}
        onConfirm={() => void cancel()}
        onCancel={() => setConfirm(false)}
      />
    </ScreenTemplate>
  );
}
