// Input limits. They match the server. Do not raise them here.

export const LIMITS = {
  displayName: 80,
  goalTitle: 120,
  whatIfTitle: 120,
  milestoneTitle: 120,
  notes: 2000,
  whyItMatters: 2000,
  timelineNote: 2000,
  whatIfDescription: 2000,
  letterBody: 10000,
  search: 100,
  lifespanMin: 1,
  lifespanMax: 150,
  targetAgeMax: 150,
  audioBytes: 15 * 1024 * 1024,
} as const;

export type UploadPurpose = 'avatar' | 'letter' | 'memory' | 'what-if';

export const ATTACHMENT_CAPS: Record<UploadPurpose, { photos: number; audio: number }> = {
  avatar: { photos: 1, audio: 0 },
  letter: { photos: 5, audio: 3 },
  memory: { photos: 5, audio: 3 },
  'what-if': { photos: 3, audio: 0 },
};

/** Required frame as width / height, plus its label. */
export const FRAME: Record<UploadPurpose, { ratio: number; label: string }> = {
  avatar: { ratio: 1, label: '1:1' },
  letter: { ratio: 4 / 3, label: '4:3' },
  memory: { ratio: 4 / 3, label: '4:3' },
  'what-if': { ratio: 4 / 3, label: '4:3' },
};

export const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const AUDIO_MIME = ['audio/mpeg', 'audio/mp4', 'audio/webm'] as const;

export function isAllowedImage(mime: string | undefined | null): boolean {
  return !!mime && (IMAGE_MIME as readonly string[]).includes(mime.toLowerCase());
}

export function isAllowedAudio(mime: string | undefined | null): boolean {
  return !!mime && (AUDIO_MIME as readonly string[]).includes(mime.toLowerCase());
}

/**
 * Fits the whole photo inside the frame without cropping or changing its own
 * ratio. Scales uniformly to the edge that fits, up or down. Leftover space is
 * split equally on both sides.
 */
export function fitInFrame(
  photo: { width: number; height: number },
  frame: { width: number; height: number },
): { width: number; height: number; x: number; y: number } {
  if (photo.width <= 0 || photo.height <= 0) {
    return { width: 0, height: 0, x: 0, y: 0 };
  }
  const scale = Math.min(frame.width / photo.width, frame.height / photo.height);
  const width = photo.width * scale;
  const height = photo.height * scale;
  return {
    width,
    height,
    x: (frame.width - width) / 2,
    y: (frame.height - height) / 2,
  };
}
