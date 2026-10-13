import type { TFunction } from 'i18next';
import type { SopText } from '@/data/repository';

const LANGS = ['en', 'hi', 'mr'] as const;
const langOf = (l: string): (typeof LANGS)[number] => ((LANGS as readonly string[]).includes(l) ? (l as (typeof LANGS)[number]) : 'en');

/** Words the repository could not translate itself, put into the reader's language: a translation key (with any parameters that are themselves keys), or text Admin wrote in up to three languages. */
export function sopText(t: TFunction, text: SopText | null | undefined, lang: string): string {
  if (!text) return '';
  if (text.key) {
    const lng = langOf(lang);
    const params: Record<string, string | number> = { ...(text.params ?? {}) };
    for (const [k, key] of Object.entries(text.paramKeys ?? {})) params[k] = t(key, { lng, defaultValue: key.split('.').pop() ?? key });
    return t(text.key, { ...params, lng });
  }
  return text[langOf(lang)] ?? text.en ?? text.hi ?? text.mr ?? '';
}
