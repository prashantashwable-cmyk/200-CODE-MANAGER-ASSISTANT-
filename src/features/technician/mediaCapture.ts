/**
 * Getting a capture ready to keep, in the browser (124): a still is scaled down to what a phone can hold and sent over a poor
 * connection without becoming useless as proof; a video gets its length and a poster frame; the phone's position is asked for but never
 * waited on. Nothing here decides whether the capture is acceptable: that is `evidence.ts`, shared with the repository.
 */
import type { GeoPoint } from '@/data/types';
import { analyseImage } from '@/features/onboarding/imageQuality';
import type { ImageQualityVerdict } from '@/features/onboarding/imageQuality';

export interface PreparedStill {
  kind: 'photo';
  fileName: string;
  previewUrl: string;
  mimeType: 'image/jpeg';
  sizeBytes: number;
  width: number;
  height: number;
  /** Advisory only: a technician in a dark pit may have no better picture to take. */
  quality: ImageQualityVerdict;
}

export interface PreparedVideo {
  kind: 'video';
  fileName: string;
  previewUrl: string;
  mediaUrl: string;
  mimeType: string;
  sizeBytes: number;
  durationS: number;
}

/** From the best a phone sends to the least that still reads: the picture is never scaled below LEAST_EDGE, so a label or a
 *  torque mark stays readable. */
const STEPS: { edge: number; q: number }[] = [
  { edge: 1600, q: 0.8 },
  { edge: 1280, q: 0.72 },
  { edge: 1024, q: 0.65 },
];
/** A compressed still above this is tried again at the next step. */
const TARGET_BYTES = 700_000;

const dataUrlBytes = (url: string) => Math.round((url.length - url.indexOf(',') - 1) * 0.75);

export async function prepareStill(file: File): Promise<PreparedStill> {
  const bitmap = await createImageBitmap(file);
  try {
    let out = '';
    let width = bitmap.width;
    let height = bitmap.height;
    for (const step of STEPS) {
      const scale = Math.min(1, step.edge / Math.max(bitmap.width, bitmap.height));
      width = Math.max(1, Math.round(bitmap.width * scale));
      height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('unreadable');
      ctx.drawImage(bitmap, 0, 0, width, height);
      out = canvas.toDataURL('image/jpeg', step.q);
      if (dataUrlBytes(out) <= TARGET_BYTES) break;
    }
    let quality: ImageQualityVerdict = 'ok';
    try {
      const q = await analyseImage(file);
      // For an ID photo "unreadable" means too smooth to read; for evidence that is simply very blurry.
      quality = q.verdict === 'unreadable' && Number.isFinite(q.sharpness) ? 'blurry' : q.verdict;
    } catch {
      quality = 'ok';
    }
    return { kind: 'photo', fileName: file.name, previewUrl: out, mimeType: 'image/jpeg', sizeBytes: dataUrlBytes(out), width, height, quality };
  } finally {
    bitmap.close();
  }
}

/** Length and a poster frame. A phone's recorder can leave the length unknown until the end is reached; that is handled. */
export function prepareVideo(file: File): Promise<PreparedVideo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      reject(new Error('unreadable'));
    };
    const timer = window.setTimeout(fail, 10_000);
    const poster = () => {
      if (settled) return;
      const duration = video.duration;
      if (!Number.isFinite(duration)) return;
      video.onseeked = () => {
        if (settled) return;
        try {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, 480 / Math.max(video.videoWidth || 480, 1));
          canvas.width = Math.max(2, Math.round((video.videoWidth || 480) * scale));
          canvas.height = Math.max(2, Math.round((video.videoHeight || 270) * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) return fail();
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          settled = true;
          window.clearTimeout(timer);
          resolve({ kind: 'video', fileName: file.name, previewUrl: canvas.toDataURL('image/jpeg', 0.7), mediaUrl: url, mimeType: file.type, sizeBytes: file.size, durationS: Math.round(duration * 10) / 10 });
        } catch {
          fail();
        }
      };
      video.currentTime = Math.min(0.5, duration / 2);
    };
    video.onerror = fail;
    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration)) return poster();
      // Length not known yet: jumping far ahead makes the browser work it out.
      video.ontimeupdate = () => {
        if (!Number.isFinite(video.duration)) return;
        video.ontimeupdate = null;
        poster();
      };
      video.currentTime = 1e101;
    };
    video.src = url;
  });
}

/** Where the phone is, if it can say quickly. Never blocks a capture: no answer inside the wait is no location. */
export function currentPlace(waitMs = 2500): Promise<GeoPoint | undefined> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(undefined);
    const timer = window.setTimeout(() => resolve(undefined), waitMs);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        window.clearTimeout(timer);
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => {
        window.clearTimeout(timer);
        resolve(undefined);
      },
      { maximumAge: 60_000, timeout: waitMs, enableHighAccuracy: false },
    );
  });
}
