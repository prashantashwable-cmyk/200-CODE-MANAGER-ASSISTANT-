/**
 * Blur and glare detection for captured ID photos.
 *
 * This is a real measurement, not a simulation. The document wizards require
 * rejecting an unreadable ID photo with a specific retake instruction, and that
 * is genuinely doable in the browser:
 *
 *   - blur  — variance of the Laplacian. A sharp photo has strong local
 *             intensity changes at edges, so the second derivative varies a
 *             lot; a blurred one is smooth, so the variance collapses.
 *   - glare — the fraction of pixels blown out to near-white. Flash on a
 *             laminated Aadhaar card is the classic failure in the field.
 *
 * The thresholds below are tuned for phone photos of documents downscaled to
 * ANALYSIS_WIDTH. They are a usability gate, not a security control.
 */

export type ImageQualityVerdict = 'ok' | 'blurry' | 'glare' | 'dark' | 'unreadable';

export interface ImageQuality {
  verdict: ImageQualityVerdict;
  /** Laplacian variance. Higher is sharper. */
  sharpness: number;
  /** 0..1 share of near-white pixels. */
  glareFraction: number;
  /** 0..255 mean luminance. */
  brightness: number;
}

const ANALYSIS_WIDTH = 360;
const SHARPNESS_FLOOR = 55;
const GLARE_CEILING = 0.18;
const DARK_FLOOR = 55;

/** Reads a picked file and measures whether it is good enough to accept. */
export async function analyseImage(file: File): Promise<ImageQuality> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, ANALYSIS_WIDTH / bitmap.width);
  const width = Math.max(2, Math.round(bitmap.width * scale));
  const height = Math.max(2, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    bitmap.close();
    // Without a 2D context we cannot judge it; accepting is safer than
    // blocking an applicant on a browser quirk.
    return { verdict: 'ok', sharpness: Number.NaN, glareFraction: 0, brightness: 128 };
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const { data } = context.getImageData(0, 0, width, height);

  // Single grayscale pass, collecting brightness and glare as we go.
  const gray = new Float32Array(width * height);
  let brightnessSum = 0;
  let blownOut = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[p] = luminance;
    brightnessSum += luminance;
    if (luminance > 245) blownOut += 1;
  }
  const pixelCount = width * height;
  const brightness = brightnessSum / pixelCount;
  const glareFraction = blownOut / pixelCount;

  // 4-neighbour Laplacian, skipping the border.
  let sum = 0;
  let sumSquares = 0;
  let counted = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const laplacian =
        4 * gray[index] -
        gray[index - 1] -
        gray[index + 1] -
        gray[index - width] -
        gray[index + width];
      sum += laplacian;
      sumSquares += laplacian * laplacian;
      counted += 1;
    }
  }
  const mean = counted ? sum / counted : 0;
  const sharpness = counted ? sumSquares / counted - mean * mean : 0;

  // Order matters: a photo can be both blurry and glared, and the retake
  // instruction should name the problem the user can fix most directly.
  let verdict: ImageQualityVerdict = 'ok';
  if (glareFraction > GLARE_CEILING) verdict = 'glare';
  else if (brightness < DARK_FLOOR) verdict = 'dark';
  else if (sharpness < SHARPNESS_FLOOR * 0.4) verdict = 'unreadable';
  else if (sharpness < SHARPNESS_FLOOR) verdict = 'blurry';

  return { verdict, sharpness, glareFraction, brightness };
}
