// Writes one translation file per language for the production build (src/i18n/generated/<lang>.json, not committed).
// It runs the same assembly the app uses in development (src/i18n/assemble.ts) through Vite, so the two cannot differ.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
try {
  const { buildResources } = await server.ssrLoadModule('/src/i18n/assemble.ts');
  const all = buildResources();
  mkdirSync('src/i18n/generated', { recursive: true });
  for (const [lang, tree] of Object.entries(all)) {
    const text = JSON.stringify(tree);
    writeFileSync(`src/i18n/generated/${lang}.json`, text);
    console.log(`build-locales: ${lang} ${(text.length / 1e6).toFixed(2)} MB`);
  }
} finally {
  await server.close();
}
