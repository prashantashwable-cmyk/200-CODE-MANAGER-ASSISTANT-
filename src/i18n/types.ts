import type { Language } from '@/data/types';

/** A nested translation tree. Leaves are strings; branches are more trees. */
export interface TranslationNode {
  [key: string]: string | TranslationNode;
}

/**
 * What every `*.i18n.ts` file default-exports.
 *
 * All three languages are mandatory and must contain the SAME key set. An
 * English string copied verbatim into `hi` or `mr` counts as missing — run
 * `npm run lint:keys` to check.
 */
export type ScreenTranslations = Record<Language, TranslationNode>;

export const LANGUAGES: Language[] = ['en', 'hi', 'mr'];

/** Shown in its own language, as language pickers conventionally are. */
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
};
