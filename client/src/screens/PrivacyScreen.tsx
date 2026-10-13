import { useState } from 'react';
import { Linking } from 'react-native';
import { api, type DeleteAccountResult, type ExportResult } from '../api';
import { config } from '../config';
import { AppText } from '../components/atoms/AppText';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { ConfirmDialog } from '../components/molecules/ConfirmDialog';
import { Notice } from '../components/molecules/Notice';
import { TextField } from '../components/molecules/TextField';
import { ScreenTemplate } from '../components/templates/ScreenTemplate';
import { toFormFailure } from '../lib/fieldErrors';
import { openSafeUrl } from '../lib/links';
import { useAuth } from '../state/AuthContext';
import { t } from '../strings';

/** The exact words the server expects before it deletes an account. */
export const DELETE_PHRASE = 'DELETE MY ACCOUNT';

export function PrivacyScreen() {
  const { endSession } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | undefined>();
  const [exportError, setExportError] = useState<string | undefined>();
  const [confirmExport, setConfirmExport] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [deleted, setDeleted] = useState<DeleteAccountResult | undefined>();

  const { privacyPolicyUrl, termsUrl, supportUrl } = config.legal;

  const runExport = async () => {
    setConfirmExport(false);
    setExporting(true);
    setExportError(undefined);
    setExportResult(undefined);
    try {
      setExportResult(await api.privacy.export());
    } catch (e) {
      setExportError(toFormFailure(e).message);
    } finally {
      setExporting(false);
    }
  };

  const runDelete = async () => {
    setDeleting(true);
    setDeleteError(undefined);
    try {
      // The server answers only after the deletion has run.
      setDeleted(await api.privacy.deleteAccount(phrase));
      setConfirmDelete(false);
    } catch (e) {
      setDeleteError(toFormFailure(e).message);
    } finally {
      setDeleting(false);
    }
  };

  if (deleted) {
    return (
      <ScreenTemplate>
        <AppText variant="title">{t.privacy.deletedTitle}</AppText>
        <AppText>{t.privacy.deletedBody}</AppText>
        <Notice icon="info" message={deleted.backupNotice} />
        <Button label={t.common.done} onPress={() => void endSession()} />
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate>
      <AppText variant="title">{t.privacy.title}</AppText>

      <Card>
        <AppText variant="heading">{t.privacy.legalTitle}</AppText>
        {privacyPolicyUrl || termsUrl || supportUrl ? (
          <>
            {privacyPolicyUrl ? <Button label={t.welcome.privacyPolicy} variant="secondary" icon="external-link" onPress={() => void Linking.openURL(privacyPolicyUrl)} /> : null}
            {termsUrl ? <Button label={t.welcome.terms} variant="secondary" icon="external-link" onPress={() => void Linking.openURL(termsUrl)} /> : null}
            {supportUrl ? <Button label={t.privacy.support} variant="secondary" icon="life-buoy" onPress={() => void Linking.openURL(supportUrl)} /> : null}
          </>
        ) : (
          <AppText muted>{t.welcome.legalPending}</AppText>
        )}
      </Card>

      <Card>
        <AppText variant="heading">{t.privacy.exportTitle}</AppText>
        <AppText muted>{t.privacy.exportBody}</AppText>
        {exportError ? <Notice icon="alert-circle" message={exportError} /> : null}
        {exportResult ? (
          <>
            <Notice icon="check" message={t.privacy.exportReady(Math.round(exportResult.expiresIn / 60))} />
            <Button label={t.privacy.openExport} icon="download" onPress={() => void openSafeUrl(exportResult.url)} />
          </>
        ) : null}
        <Button label={exporting ? t.privacy.exporting : t.privacy.exportAction} icon="archive" variant="secondary" onPress={() => setConfirmExport(true)} loading={exporting} />
        {exporting ? (
          <AppText variant="caption" muted accessibilityLiveRegion="polite">
            {t.privacy.exportWait}
          </AppText>
        ) : null}
      </Card>

      <Card>
        <AppText variant="heading">{t.privacy.deleteTitle}</AppText>
        <AppText muted>{t.privacy.deleteBody}</AppText>
        <Button label={t.privacy.deleteAction} icon="trash-2" variant="secondary" onPress={() => setConfirmDelete(true)} />
      </Card>

      <ConfirmDialog
        visible={confirmExport}
        title={t.privacy.exportConfirmTitle}
        body={t.privacy.exportConfirmBody}
        confirmLabel={t.privacy.exportAction}
        onConfirm={() => void runExport()}
        onCancel={() => setConfirmExport(false)}
      />
      <ConfirmDialog
        visible={confirmDelete}
        title={t.privacy.deleteConfirmTitle}
        body={t.privacy.deleteConfirmBody(DELETE_PHRASE)}
        confirmLabel={t.privacy.deleteAction}
        busy={deleting}
        error={deleteError}
        onConfirm={() => {
          if (phrase === DELETE_PHRASE) void runDelete();
          else setDeleteError(t.privacy.phraseMismatch);
        }}
        onCancel={() => {
          setConfirmDelete(false);
          setPhrase('');
          setDeleteError(undefined);
        }}
      >
        <TextField label={t.privacy.phraseLabel} value={phrase} onChangeText={(v) => { setPhrase(v); setDeleteError(undefined); }} autoCapitalize="characters" maxLength={30} />
      </ConfirmDialog>
    </ScreenTemplate>
  );
}
