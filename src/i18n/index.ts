import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './common.i18n';
import { LANGUAGES } from './types';
import type { ScreenTranslations, TranslationNode } from './types';
import type { Language } from '@/data/types';

/**
 * Translations are ASSEMBLED, not centralised.
 *
 * Every screen ships its own `<name>.i18n.ts` next to its view, and this module
 * discovers and merges them at build time. That is deliberate: 40+ screens can
 * be built independently without any of them editing one shared en.json —
 * which is exactly where key collisions and accidental overwrites come from.
 *
 * To add copy for a new screen: create `src/screens/<screen>/<screen>.i18n.ts`
 * with a default export of `{ en, hi, mr }`. Nothing else to register.
 */

const screenBundles = import.meta.glob<{ default: ScreenTranslations }>(
  ['../screens/**/*.i18n.ts', '../features/**/*.i18n.ts'],
  { eager: true },
);

function isNode(value: unknown): value is TranslationNode {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(target: TranslationNode, source: TranslationNode): TranslationNode {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];
    if (isNode(value) && isNode(existing)) {
      deepMerge(existing, value);
    } else {
      if (import.meta.env.DEV && existing !== undefined && !isNode(value)) {
        // Two screens claiming the same key is a real bug — one will win
        // silently otherwise, and the loser shows the wrong text.
        console.warn(`[i18n] duplicate translation key overwritten: ${key}`);
      }
      target[key] = value;
    }
  }
  return target;
}

function buildResources() {
  const resources: Record<Language, { translation: TranslationNode }> = {
    en: { translation: {} },
    hi: { translation: {} },
    mr: { translation: {} },
  };

  for (const lang of LANGUAGES) {
    deepMerge(resources[lang].translation, common[lang]);
  }

  for (const path of Object.keys(screenBundles).sort()) {
    const bundle = screenBundles[path]?.default;
    if (!bundle) continue;
    for (const lang of LANGUAGES) {
      if (bundle[lang]) deepMerge(resources[lang].translation, bundle[lang]);
    }
  }

  return resources;
}

export const STORAGE_KEY_LANGUAGE = 'aiec.language';

function initialLanguage(): Language {
  const saved = localStorage.getItem(STORAGE_KEY_LANGUAGE) as Language | null;
  if (saved && LANGUAGES.includes(saved)) return saved;
  const browser = navigator.language.slice(0, 2) as Language;
  return LANGUAGES.includes(browser) ? browser : 'en';
}

void i18n.use(initReactI18next).init({
  resources: buildResources(),
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/**
 * Switching language also switches the font pairing: `lang` on <html> is what
 * the Devanagari rule in tokens.css keys off, so Hindi and Marathi never fall
 * back to a system font.
 */
export function applyLanguage(lang: Language) {
  void i18n.changeLanguage(lang);
  document.documentElement.setAttribute('lang', lang);
  localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
}

// Apply once at module load so the very first paint is already correct.
document.documentElement.setAttribute('lang', i18n.language || 'en');

export default i18n;
export { LANGUAGES, LANGUAGE_LABELS } from './types';
export type { ScreenTranslations, TranslationNode } from './types';
