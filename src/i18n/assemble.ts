import common from './common.i18n';
import { LANGUAGES } from './types';
import type { ScreenTranslations, TranslationNode } from './types';
import type { Language } from '@/data/types';

/**
 * Translations are ASSEMBLED, not centralised: every screen ships its own `<name>.i18n.ts`, discovered here.
 * In development this runs in the browser; for a production build `scripts/build-locales.mjs` runs it once and
 * writes one file per language (`src/i18n/generated/<lang>.json`), so a reader downloads only their own language first.
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
        // Two screens claiming the same key is a real bug — one will win silently otherwise.
        console.warn(`[i18n] duplicate translation key overwritten: ${key}`);
      }
      target[key] = value;
    }
  }
  return target;
}

export function buildResources(): Record<Language, TranslationNode> {
  const resources: Record<Language, TranslationNode> = { en: {}, hi: {}, mr: {} };
  for (const lang of LANGUAGES) deepMerge(resources[lang], common[lang]);
  for (const path of Object.keys(screenBundles).sort()) {
    const bundle = screenBundles[path]?.default;
    if (!bundle) continue;
    for (const lang of LANGUAGES) if (bundle[lang]) deepMerge(resources[lang], bundle[lang]);
  }
  return resources;
}
