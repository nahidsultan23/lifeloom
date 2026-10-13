import {
  ATTACHMENT_CAPS,
  FRAME,
  LIMITS,
  fitInFrame,
  isAllowedAudio,
  isAllowedImage,
} from '../src/lib/limits';

describe('input limits match the brief', () => {
  it('has the documented maximums', () => {
    expect(LIMITS.displayName).toBe(80);
    expect(LIMITS.goalTitle).toBe(120);
    expect(LIMITS.whatIfTitle).toBe(120);
    expect(LIMITS.milestoneTitle).toBe(120);
    expect(LIMITS.notes).toBe(2000);
    expect(LIMITS.whyItMatters).toBe(2000);
    expect(LIMITS.timelineNote).toBe(2000);
    expect(LIMITS.whatIfDescription).toBe(2000);
    expect(LIMITS.letterBody).toBe(10000);
    expect(LIMITS.search).toBe(100);
    expect(LIMITS.audioBytes).toBe(15 * 1024 * 1024);
  });

  it('has the documented attachment caps and frames', () => {
    expect(ATTACHMENT_CAPS.avatar).toEqual({ photos: 1, audio: 0 });
    expect(ATTACHMENT_CAPS.letter).toEqual({ photos: 5, audio: 3 });
    expect(ATTACHMENT_CAPS.memory).toEqual({ photos: 5, audio: 3 });
    expect(ATTACHMENT_CAPS['what-if']).toEqual({ photos: 3, audio: 0 });
    expect(FRAME.avatar.label).toBe('1:1');
    expect(FRAME.letter.label).toBe('4:3');
    expect(FRAME.memory.label).toBe('4:3');
    expect(FRAME['what-if'].label).toBe('4:3');
  });

  it('allows only the listed file types', () => {
    expect(isAllowedImage('image/jpeg')).toBe(true);
    expect(isAllowedImage('image/webp')).toBe(true);
    expect(isAllowedImage('image/gif')).toBe(false);
    expect(isAllowedImage('image/heic')).toBe(false);
    expect(isAllowedAudio('audio/mpeg')).toBe(true);
    expect(isAllowedAudio('audio/mp4')).toBe(true);
    expect(isAllowedAudio('audio/wav')).toBe(false);
    expect(isAllowedAudio(undefined)).toBe(false);
  });
});

describe('fitInFrame', () => {
  const frame = { width: 400, height: 300 };

  it('keeps a matching photo as is', () => {
    expect(fitInFrame({ width: 800, height: 600 }, frame)).toEqual({ width: 400, height: 300, x: 0, y: 0 });
  });

  it('scales a wide photo to the width and splits the empty space top and bottom', () => {
    const fit = fitInFrame({ width: 1600, height: 400 }, frame);
    expect(fit.width).toBe(400);
    expect(fit.height).toBe(100);
    expect(fit.x).toBe(0);
    expect(fit.y).toBe(100);
  });

  it('scales a tall photo to the height and splits the empty space left and right', () => {
    const fit = fitInFrame({ width: 300, height: 600 }, frame);
    expect(fit.height).toBe(300);
    expect(fit.width).toBe(150);
    expect(fit.x).toBe(125);
    expect(fit.y).toBe(0);
  });

  it('scales a small photo up and never crops it', () => {
    const fit = fitInFrame({ width: 40, height: 30 }, frame);
    expect(fit.width).toBe(400);
    expect(fit.height).toBe(300);
  });

  it('never changes the photo ratio', () => {
    const photo = { width: 1234, height: 777 };
    const fit = fitInFrame(photo, { width: 360, height: 360 });
    expect(fit.width / fit.height).toBeCloseTo(photo.width / photo.height, 6);
    expect(fit.width).toBeLessThanOrEqual(360);
    expect(fit.height).toBeLessThanOrEqual(360);
    expect(fit.x * 2 + fit.width).toBeCloseTo(360, 6);
    expect(fit.y * 2 + fit.height).toBeCloseTo(360, 6);
  });

  it('handles a photo with no size without dividing by zero', () => {
    expect(fitInFrame({ width: 0, height: 0 }, frame)).toEqual({ width: 0, height: 0, x: 0, y: 0 });
  });
});
