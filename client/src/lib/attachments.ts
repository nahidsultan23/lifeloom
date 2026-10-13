import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api';
import { t } from '../strings';
import { AUDIO_MIME, LIMITS, isAllowedAudio, isAllowedImage } from './limits';

export interface PendingFile {
  kind: 'photo' | 'audio';
  uri: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  size?: number;
}

export type PickResult =
  | { ok: true; file: PendingFile }
  | { ok: false; cancelled: boolean; message?: string };

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  webm: 'audio/webm',
};

function mimeFrom(name: string | undefined, reported: string | undefined | null): string {
  if (reported && reported.includes('/')) return reported.toLowerCase();
  const ext = name?.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MIME[ext] ?? '';
}

export async function pickPhoto(): Promise<PickResult> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    allowsMultipleSelection: false,
    quality: 1,
    exif: false,
  });
  if (result.canceled || !result.assets[0]) return { ok: false, cancelled: true };
  const asset = result.assets[0];
  const name = asset.fileName ?? `photo.${asset.uri.split('.').pop() ?? 'jpg'}`;
  const mimeType = mimeFrom(name, asset.mimeType);
  if (!isAllowedImage(mimeType)) {
    deleteLocalFile(asset.uri);
    return { ok: false, cancelled: false, message: t.attachments.badPhotoType };
  }
  return {
    ok: true,
    file: {
      kind: 'photo',
      uri: asset.uri,
      name,
      mimeType,
      width: asset.width,
      height: asset.height,
      size: asset.fileSize,
    },
  };
}

export async function pickAudio(): Promise<PickResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [...AUDIO_MIME],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return { ok: false, cancelled: true };
  const asset = result.assets[0];
  const mimeType = mimeFrom(asset.name, asset.mimeType);
  if (!isAllowedAudio(mimeType)) {
    deleteLocalFile(asset.uri);
    return { ok: false, cancelled: false, message: t.attachments.badAudioType };
  }
  if (asset.size !== undefined && asset.size > LIMITS.audioBytes) {
    deleteLocalFile(asset.uri);
    return { ok: false, cancelled: false, message: t.attachments.audioTooLarge };
  }
  return {
    ok: true,
    file: {
      kind: 'audio',
      uri: asset.uri,
      name: asset.name,
      mimeType,
      width: 0,
      height: 0,
      size: asset.size,
    },
  };
}

/** Removes the picker's cached copy. Failure to delete is not worth interrupting the user. */
export function deleteLocalFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Already gone, or the platform owns it.
  }
}

export interface ResolvedAttachment {
  id: string;
  url: string;
  kind: 'photo' | 'audio';
}

/**
 * Asks the server for a short-lived private link and finds out what the file is.
 * The link is never logged or stored.
 */
export async function resolveAttachment(
  id: string,
  signal?: AbortSignal,
): Promise<ResolvedAttachment | null> {
  try {
    const access = await api.uploads.access(id, { signal });
    let kind: 'photo' | 'audio' = 'photo';
    try {
      const probe = await fetch(access.url, { headers: { Range: 'bytes=0-0' }, signal });
      const type = probe.headers.get('content-type') ?? '';
      kind = type.startsWith('audio/') ? 'audio' : 'photo';
    } catch {
      // Treat as a photo. The image view shows a placeholder if it is not.
    }
    return { id, url: access.url, kind };
  } catch {
    return null;
  }
}
