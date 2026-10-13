/**
 * India-specific contact rules, in one place. The screens and the repository both call these, so a number the form
 * accepts is a number the record accepts. Pure: nothing here reads the repository.
 */

export const digitsOf = (value: string): string => value.replace(/\D/g, '');

/** The ten digits of an Indian mobile number however it was typed: "+91 98220 11001", "098220 11001", "9822011001". */
export function mobile10(value: string): string {
  const d = digitsOf(value);
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length === 11 && d.startsWith('0')) return d.slice(1);
  return d;
}

/** An Indian mobile number: ten digits starting 6 to 9, with an optional +91 or 0 in front. */
export const isIndianMobile = (value: string): boolean => /^[6-9]\d{9}$/.test(mobile10(value));

/** An Indian PIN code: six digits, never starting 0. */
export const isPincode = (value: string): boolean => /^[1-9]\d{5}$/.test(value.trim());

/** A plausible email address (shape only; whether it receives mail is not known here). */
export const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
