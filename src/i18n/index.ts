import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANGUAGES } from './types';
import type { TranslationNode } from './types';
import type { Language } from '@/data/types';

/**
 * Translations are assembled from every screen's own `<name>.i18n.ts` (see ./assemble.ts).
 *
 * Development: everything is assembled in the browser, all three languages at once.
 * Production: `npm run build` first writes one JSON file per language; the reader's own language (and English, the
 * fallback) load before the first paint, and the other language follows in the background. A screen that shows
 * another language on purpose (a lesson track, a template preview) re-renders when it arrives (`bindI18nStore`).
 */
const generated = import.meta.glob<TranslationNode>('./generated/*.json', { import: 'default' });

export const STORAGE_KEY_LANGUAGE = 'aiec.language';

function initialLanguage(): Language {
  let saved: Language | null = null;
  try { saved = localStorage.getItem(STORAGE_KEY_LANGUAGE) as Language | null; } catch { /* storage blocked */ }
  if (saved && LANGUAGES.includes(saved)) return saved;
  const browser = navigator.language.slice(0, 2) as Language;
  return LANGUAGES.includes(browser) ? browser : 'en';
}

const loading = new Map<Language, Promise<void>>();
/** Makes sure one language's text is present; safe to call any number of times. */
export function ensureLanguage(lang: Language): Promise<void> {
  if (i18n.hasResourceBundle(lang, 'translation')) return Promise.resolve();
  let p = loading.get(lang);
  if (!p) {
    const load = generated[`./generated/${lang}.json`];
    p = load ? load().then((tree) => { i18n.addResourceBundle(lang, 'translation', tree, true, true); }) : Promise.resolve();
    loading.set(lang, p);
  }
  return p;
}

async function start(): Promise<void> {
  const lng = initialLanguage();
  await i18n.use(initReactI18next).init({
    resources: {},
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { bindI18nStore: 'added' },
  });
  if (import.meta.env.DEV || Object.keys(generated).length === 0) {
    // No generated files (development, tests, or a build that skipped the step): assemble everything here.
    const { buildResources } = await import('./assemble');
    const all = buildResources();
    for (const l of LANGUAGES) i18n.addResourceBundle(l, 'translation', all[l], true, true);
  } else {
    await Promise.all([ensureLanguage('en'), ensureLanguage(lng)]);
    // The rest after the first paint, so a screen that shows another language finds it soon after.
    setTimeout(() => { for (const l of LANGUAGES) void ensureLanguage(l); }, 1500);
  }
  document.documentElement.setAttribute('lang', i18n.language || 'en');
}

/** Resolves once the first language is ready; main.tsx waits for it before the first render. */
export const i18nReady: Promise<void> = start();

/**
 * Switching language also switches the font pairing: `lang` on <html> is what
 * the Devanagari rule in tokens.css keys off, so Hindi and Marathi never fall
 * back to a system font.
 */
export function applyLanguage(lang: Language) {
  void ensureLanguage(lang).then(() => i18n.changeLanguage(lang));
  document.documentElement.setAttribute('lang', lang);
  try { localStorage.setItem(STORAGE_KEY_LANGUAGE, lang); } catch { /* storage blocked */ }
}

export default i18n;
export { LANGUAGES, LANGUAGE_LABELS } from './types';
export type { ScreenTranslations, TranslationNode } from './types';
