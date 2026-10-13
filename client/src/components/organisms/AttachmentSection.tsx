import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { api, ApiError } from '../../api';
import {
  deleteLocalFile,
  pickAudio,
  pickPhoto,
  resolveAttachment,
  type PendingFile,
  type ResolvedAttachment,
} from '../../lib/attachments';
import { ATTACHMENT_CAPS, FRAME, type UploadPurpose } from '../../lib/limits';
import { t } from '../../strings';
import { radius, spacing, useTheme } from '../../theme';
import { AppText } from '../atoms/AppText';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { ConfirmDialog } from '../molecules/ConfirmDialog';
import { Notice } from '../molecules/Notice';
import { PhotoFramePreview } from '../molecules/PhotoFramePreview';

interface Props {
  purpose: UploadPurpose;
  /** Id of the letter, memory, or what-if path. Ignored for the avatar. */
  parentId: string;
  attachmentIds: string[];
  /** Called after an attachment is added or removed so the parent can reload. */
  onChanged: () => void;
  /** False once the record can no longer change, such as a delivered letter. */
  editable?: boolean;
}

function AudioItem({ url, label }: { url: string; label: string }) {
  const player = useAudioPlayer({ uri: url });
  const status = useAudioPlayerStatus(player);
  return (
    <Button
      label={status.playing ? t.attachments.pause(label) : t.attachments.play(label)}
      icon={status.playing ? 'pause' : 'play'}
      variant="secondary"
      onPress={() => (status.playing ? player.pause() : player.play())}
    />
  );
}

export function AttachmentSection({ purpose, parentId, attachmentIds, onChanged, editable = true }: Props) {
  const colors = useTheme();
  const caps = ATTACHMENT_CAPS[purpose];
  const frame = FRAME[purpose];
  const [items, setItems] = useState<ResolvedAttachment[]>([]);
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [removing, setRemoving] = useState<ResolvedAttachment | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const pendingRef = useRef<PendingFile | null>(null);
  pendingRef.current = pending;

  const idsKey = attachmentIds.join(',');
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const resolved = await Promise.all(
        attachmentIds.map((id) => resolveAttachment(id, controller.signal)),
      );
      if (!controller.signal.aborted) {
        setItems(resolved.filter((item): item is ResolvedAttachment => item !== null));
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Leaving the screen cancels an upload and removes the cached copy.
  useEffect(
    () => () => {
      abort.current?.abort();
      if (pendingRef.current) deleteLocalFile(pendingRef.current.uri);
    },
    [],
  );

  const photoCount = items.filter((i) => i.kind === 'photo').length;
  const audioCount = items.filter((i) => i.kind === 'audio').length;

  const choose = async (kind: 'photo' | 'audio') => {
    setError(undefined);
    // A new avatar replaces the old one, so only the other slots have a hard stop.
    if (kind === 'photo' && purpose !== 'avatar' && photoCount >= caps.photos) {
      setError(t.attachments.photoLimit(caps.photos));
      return;
    }
    if (kind === 'audio' && audioCount >= caps.audio) {
      setError(t.attachments.audioLimit(caps.audio));
      return;
    }
    const result = await (kind === 'photo' ? pickPhoto() : pickAudio());
    if (!result.ok) {
      if (!result.cancelled) setError(result.message);
      return;
    }
    if (pending) deleteLocalFile(pending.uri);
    setPending(result.file);
  };

  const cancelPending = () => {
    if (pending) deleteLocalFile(pending.uri);
    setPending(null);
    setProgress(null);
    setError(undefined);
  };

  const upload = async () => {
    if (!pending) return;
    setError(undefined);
    setProgress(0);
    const controller = new AbortController();
    abort.current = controller;
    let uploadedId: string | undefined;
    try {
      const record = await api.uploads.create(
        purpose,
        { uri: pending.uri, name: pending.name, mimeType: pending.mimeType },
        { onProgress: setProgress, signal: controller.signal },
      );
      uploadedId = record._id;
      await api.uploads.attach(record._id, purpose, parentId);
      uploadedId = undefined;
      deleteLocalFile(pending.uri);
      setPending(null);
      setProgress(null);
      onChanged();
    } catch (e) {
      // An upload that never got attached would be an orphan, so remove it.
      if (uploadedId) api.uploads.remove(uploadedId).catch(() => undefined);
      setProgress(null);
      if (e instanceof ApiError && e.kind === 'cancelled') return;
      setError(
        e instanceof ApiError
          ? e.code === 'ATTACHMENT_LIMIT_EXCEEDED'
            ? t.attachments.serverLimit
            : e.message
          : t.errors.generic,
      );
    } finally {
      abort.current = null;
    }
  };

  const remove = async () => {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      await api.uploads.remove(removing.id);
      setRemoving(null);
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t.errors.generic);
      setRemoving(null);
    } finally {
      setRemoveBusy(false);
    }
  };

  const uploading = progress !== null;

  return (
    <View style={styles.wrap}>
      <AppText variant="heading">{t.attachments.title}</AppText>
      {items.length === 0 && !pending ? (
        <AppText muted>{t.attachments.none}</AppText>
      ) : null}

      <View style={styles.grid}>
        {items
          .filter((i) => i.kind === 'photo')
          .map((item, index) => (
            <View
              key={item.id}
              style={[styles.thumb, { aspectRatio: frame.ratio, borderColor: colors.border, backgroundColor: colors.frame }]}
            >
              <Image
                source={{ uri: item.url }}
                resizeMode="contain"
                style={styles.fill}
                accessibilityLabel={t.attachments.photoN(index + 1)}
              />
            </View>
          ))}
      </View>
      {items
        .filter((i) => i.kind === 'audio')
        .map((item, index) => (
          <AudioItem key={item.id} url={item.url} label={t.attachments.audioN(index + 1)} />
        ))}

      {editable && items.length > 0 ? (
        <View style={styles.row}>
          {items.map((item, index) => (
            <Button
              key={item.id}
              variant="quiet"
              icon="trash-2"
              label={t.attachments.removeN(
                item.kind === 'photo' ? t.attachments.photoN(index + 1) : t.attachments.audioN(index + 1),
              )}
              onPress={() => setRemoving(item)}
            />
          ))}
        </View>
      ) : null}

      {pending ? (
        <Card>
          {pending.kind === 'photo' ? (
            <PhotoFramePreview
              uri={pending.uri}
              width={pending.width}
              height={pending.height}
              purpose={purpose}
            />
          ) : (
            <AppText>{pending.name}</AppText>
          )}
          {uploading ? (
            <AppText accessibilityLiveRegion="polite" muted>
              {t.attachments.uploading(Math.round((progress ?? 0) * 100))}
            </AppText>
          ) : null}
          <Button
            label={error ? t.common.tryAgain : t.attachments.useThis}
            icon="upload"
            onPress={upload}
            loading={uploading}
          />
          <Button label={t.attachments.chooseAnother} variant="secondary" onPress={() => choose(pending.kind)} disabled={uploading} />
          <Button
            label={uploading ? t.attachments.cancelUpload : t.common.cancel}
            variant="quiet"
            onPress={uploading ? () => abort.current?.abort() : cancelPending}
          />
        </Card>
      ) : null}

      {error ? <Notice icon="alert-circle" message={error} /> : null}

      {editable && !pending ? (
        <View style={styles.row}>
          {caps.photos > 0 ? (
            <Button
              label={
                purpose === 'avatar' && photoCount >= 1
                  ? t.attachments.replacePhoto
                  : t.attachments.addPhoto(photoCount, caps.photos)
              }
              icon="image"
              variant="secondary"
              onPress={() => choose('photo')}
            />
          ) : null}
          {caps.audio > 0 ? (
            <Button
              label={t.attachments.addAudio(audioCount, caps.audio)}
              icon="mic"
              variant="secondary"
              onPress={() => choose('audio')}
            />
          ) : null}
        </View>
      ) : null}

      <ConfirmDialog
        visible={!!removing}
        title={t.attachments.removeTitle}
        body={t.attachments.removeBody}
        confirmLabel={t.attachments.remove}
        busy={removeBusy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  grid: { gap: spacing.sm },
  thumb: { width: '100%', borderWidth: 1, borderRadius: radius.sm, overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  row: { gap: spacing.sm },
});
