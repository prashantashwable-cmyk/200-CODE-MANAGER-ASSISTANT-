/**
 * Indian identity and banking format checks, shared by the three partner
 * onboarding wizards (surveyor, technician, supplier).
 *
 * These are format and checksum checks only. They tell you a number is
 * well-formed, not that it belongs to the person holding it — that needs a
 * real KYC provider, and every caller says so in its own copy.
 */
import { isIndianMobile, isPincode } from '@/features/validation/india';

/** Permanent Account Number: AAAAA9999A. */
export const isValidPan = (value: string): boolean =>
  /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.trim().toUpperCase());

/**
 * Aadhaar: 12 digits with a Verhoeff checksum. Checking the checksum rather
 * than just the length catches the common transposed-digit typo, which is the
 * whole reason UIDAI uses Verhoeff in the first place.
 */
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isValidAadhaar(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (!/^[2-9]\d{11}$/.test(digits)) return false;
  let checksum = 0;
  const reversed = digits.split('').reverse().map(Number);
  reversed.forEach((digit, index) => {
    checksum = VERHOEFF_D[checksum][VERHOEFF_P[index % 8][digit]];
  });
  return checksum === 0;
}

/** Never show a full Aadhaar back to the user — mask all but the last four. */
export const maskAadhaar = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 12) return value;
  return `XXXX XXXX ${digits.slice(8)}`;
};

/** IFSC: four bank letters, a reserved 0, then six branch characters. */
export const isValidIfsc = (value: string): boolean =>
  /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase());

/**
 * GSTIN: 2-digit state code, 10-char PAN, entity number, 'Z', check character.
 */
export const isValidGstin = (value: string): boolean =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.trim().toUpperCase());

/** The PAN embedded in a GSTIN — used to cross-check the two against each other. */
export const panFromGstin = (gstin: string): string => gstin.trim().toUpperCase().slice(2, 12);

/** The shared rule (`@/features/validation/india`), under the name the onboarding screens use. */
export const isValidIndianMobile = isIndianMobile;

export const isValidPincode = isPincode;

/** 0-4, with the reasons that dragged it down, for the reset-password meter. */
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  hasLength: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
}

export function scorePassword(password: string): PasswordStrength {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const score = [hasLength, hasUpper, hasDigit, hasSymbol].filter(Boolean).length as 0 | 1 | 2 | 3 | 4;
  return { score, hasLength, hasUpper, hasDigit, hasSymbol };
}
