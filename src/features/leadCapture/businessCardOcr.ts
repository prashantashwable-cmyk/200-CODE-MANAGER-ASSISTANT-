import { createWorker } from 'tesseract.js';

/**
 * Real on-device OCR for a scanned business card, via Tesseract.js — an
 * actual WASM OCR engine running in the browser, not a simulated parse.
 *
 * Tesseract.js's default worker fetches its core WASM binary and English
 * trained-data file from a CDN (jsDelivr) at first use rather than bundling
 * them into the app — the same network-dependency trade-off this app already
 * makes for map tiles and Google Fonts. The recognition itself runs entirely
 * on-device once those assets are cached; nothing about the card image or its
 * text is ever sent to a server.
 */

export interface BusinessCardFields {
  name: string;
  phone: string;
  company: string;
  rawText: string;
}

/** A 10-digit Indian mobile, optionally with a +91 / 0 prefix. */
const PHONE_PATTERN = /(?:\+?91[\s-]?)?[6-9]\d{9}/;

/** Words that mark a line as a role/title rather than a person's name. */
const ROLE_WORDS =
  /\b(owner|director|manager|architect|contractor|proprietor|engineer|builder|developer|ceo|md|founder)\b/i;

/** Company-ish suffixes that mark a line as the organisation, not a person. */
const COMPANY_HINT = /\b(pvt|ltd|llp|group|builders|developers|constructions|realty|associates|infra)\b/i;

function parseFields(rawText: string): BusinessCardFields {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const phoneMatch = rawText.match(PHONE_PATTERN);
  const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, '').slice(-10) : '';

  const companyLine = lines.find((line) => COMPANY_HINT.test(line));

  // The person's name is usually the first line that isn't the phone number,
  // isn't the company, and isn't itself a bare job title.
  const nameLine = lines.find(
    (line) =>
      line !== companyLine &&
      !PHONE_PATTERN.test(line) &&
      !ROLE_WORDS.test(line) &&
      !/\d{4,}/.test(line) &&
      line.length >= 3 &&
      line.length <= 40,
  );

  return {
    name: nameLine ?? '',
    phone,
    company: companyLine ?? '',
    rawText,
  };
}

let workerPromise: ReturnType<typeof createWorker> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng');
  }
  return workerPromise;
}

/**
 * Runs real OCR on a captured business-card image and returns a best-effort
 * field guess. This is a convenience only — every field stays fully editable,
 * since a smudged or handwritten card will genuinely misread sometimes.
 */
export async function recognizeBusinessCard(file: File): Promise<BusinessCardFields> {
  const worker = await getWorker();
  const {
    data: { text },
  } = await worker.recognize(file);
  return parseFields(text);
}
