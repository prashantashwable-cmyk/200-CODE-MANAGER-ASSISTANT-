/**
 * Translation completeness gate.
 *
 * The architecture pattern is explicit that a key present in `en` but missing
 * from `hi`/`mr` — or copied verbatim from English into them — is exactly the
 * corner-cutting the 3-file split exists to prevent, and the easiest to miss on
 * a skim because the app still runs and looks fine in English.
 *
 * This checks every `*.i18n.ts` under src/ for:
 *   1. keys present in en but missing in hi or mr
 *   2. keys whose hi/mr value is byte-identical to the English value
 *   3. leftover TODO / FIXME markers
 *
 * Exceptions are values that are legitimately identical across languages:
 * brand names, codes, and pure interpolations.
 *
 *   npm run lint:keys
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');

/** Values allowed to be identical in all three languages. */
const ALLOWED_IDENTICAL = new Set(['AIEC', 'GST', 'GSTIN', 'OTP', 'UPI', 'NEFT', 'PWA', 'SOP', 'QC', 'KYC', 'ID', 'PAN', 'SMS', 'WhatsApp', 'Google', 'AIEC.', '—', '-', '', '₹']);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.i18n.ts')) out.push(full);
  }
  return out;
}

/** Flattens a nested object literal into dotted paths. Values are strings. */
function flatten(node, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') flatten(value, path, out);
    else out[path] = value;
  }
  return out;
}

/**
 * Extracts the three language objects without executing TypeScript. The i18n
 * files are plain object literals, so a scoped eval of the object body is
 * enough and avoids adding a build step just to lint.
 */
async function loadBundle(file) {
  const source = readFileSync(file, 'utf8');
  const body = source
    .replace(/^import[\s\S]*?;\s*$/gm, '')
    .replace(/^export default \w+;?\s*$/gm, '')
    .replace(/:\s*ScreenTranslations/g, '');
  const match = body.match(/const\s+\w+\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) throw new Error('could not find the translations object');
  // eslint-disable-next-line no-new-func
  return new Function(`return (${match[1]});`)();
}

const files = walk(SRC);
let errors = 0;
let checkedKeys = 0;

for (const file of files) {
  const rel = relative(ROOT, file);
  let bundle;
  try {
    bundle = await loadBundle(file);
  } catch (err) {
    console.error(`✗ ${rel}: ${err.message}`);
    errors += 1;
    continue;
  }

  const en = flatten(bundle.en ?? {});
  const hi = flatten(bundle.hi ?? {});
  const mr = flatten(bundle.mr ?? {});
  checkedKeys += Object.keys(en).length;

  for (const [key, enValue] of Object.entries(en)) {
    for (const [lang, table] of [
      ['hi', hi],
      ['mr', mr],
    ]) {
      const value = table[key];
      if (value === undefined) {
        console.error(`✗ ${rel}: key "${key}" missing in ${lang}`);
        errors += 1;
        continue;
      }
      // Placeholder names are not translatable content — strip them before
      // deciding whether this string has any real words in it. Otherwise
      // "{{name}}: {{from}} → {{to}}" looks like untranslated English.
      const translatable = String(enValue).replace(/\{\{[^}]*\}\}/g, '').trim();
      if (
        value === enValue &&
        !ALLOWED_IDENTICAL.has(String(enValue).trim()) &&
        /[a-zA-Z]{4,}/.test(translatable)
      ) {
        console.error(`✗ ${rel}: key "${key}" in ${lang} is identical to English ("${enValue}")`);
        errors += 1;
      }
    }
  }

  for (const [lang, table] of [
    ['hi', hi],
    ['mr', mr],
  ]) {
    for (const key of Object.keys(table)) {
      if (en[key] === undefined) {
        console.error(`✗ ${rel}: key "${key}" exists in ${lang} but not in en`);
        errors += 1;
      }
    }
  }

  if (/TODO|FIXME|implement later/i.test(readFileSync(file, 'utf8'))) {
    console.error(`✗ ${rel}: contains a TODO/FIXME marker`);
    errors += 1;
  }
}

console.log(
  `\nChecked ${files.length} translation files, ${checkedKeys} keys per language.`,
);

if (errors > 0) {
  console.error(`\n${errors} problem(s) found.\n`);
  process.exit(1);
}
console.log('All three languages complete and distinct.\n');
