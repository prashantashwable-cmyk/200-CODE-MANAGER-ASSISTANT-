import type { TFunction } from 'i18next';
import type { SopText } from '@/data/repository';

const LANGS = ['en', 'hi', 'mr'] as const;
const langOf = (l: string): (typeof LANGS)[number] => ((LANGS as readonly string[]).includes(l) ? (l as (typeof LANGS)[number]) : 'en');

/**
 * Words the repository could not translate itself, put into the reader's language: a translation key (with any parameters that are themselves keys, such
 * as a category's name), or text written by Admin in up to three languages. A language Admin did not write falls back to English, and says so.
 */
export function sopText(t: TFunction, text: SopText | null | undefined, lang: string): { text: string; fallback: boolean } {
  if (!text) return { text: '', fallback: false };
  if (text.key) {
    const params: Record<string, string | number> = { ...(text.params ?? {}) };
    const lng = langOf(lang);
    for (const [k, key] of Object.entries(text.paramKeys ?? {})) params[k] = t(key, { lng, defaultValue: key.split('.').pop() ?? key });
    return { text: t(text.key, { ...params, lng }), fallback: false };
  }
  const l = langOf(lang);
  const own = text[l];
  if (own) return { text: own, fallback: false };
  return { text: text.en ?? text.hi ?? text.mr ?? '', fallback: l !== 'en' };
}

/** Every word in every language, for searching: a person finds a step by the words they know it by, whichever language it was written in. */
export function sopSearchText(t: TFunction, text: SopText | null | undefined): string {
  if (!text) return '';
  if (text.key) return sopText(t, text, 'en').text + ' ' + sopText(t, text, 'hi').text + ' ' + sopText(t, text, 'mr').text;
  return [text.en, text.hi, text.mr].filter(Boolean).join(' ');
}
