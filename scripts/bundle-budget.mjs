// Fails the build if the entry script grows past its budget. Run after `npm run build`.
// Measured 2026-10-15: the entry chunk was 7.4 MB raw / 1.8 MB gzipped with all three languages in it. Each language is now its own
// file loaded on demand (scripts/build-locales.mjs), which brought it to 2.4 MB raw / 0.71 MB gzipped; most of the rest is the in-memory
// data layer (listed in KNOWN_GAPS.md). This budget only stops it getting worse. Raise it deliberately, with a reason, never to make a build pass.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET_GZIP_BYTES = 850_000;
const dir = 'dist/assets';
const entries = readdirSync(dir).filter((f) => /^index-.*\.js$/.test(f));
if (entries.length === 0) { console.error('bundle-budget: no entry chunk found; run npm run build first'); process.exit(2); }
let worst = 0;
for (const f of entries) {
  const raw = readFileSync(`${dir}/${f}`);
  const gz = gzipSync(raw).length;
  worst = Math.max(worst, gz);
  console.log(`${f}: ${(raw.length / 1e6).toFixed(2)} MB raw, ${(gz / 1e6).toFixed(2)} MB gzipped (budget ${(BUDGET_GZIP_BYTES / 1e6).toFixed(2)} MB)`);
}
if (worst > BUDGET_GZIP_BYTES) { console.error('bundle-budget: over budget'); process.exit(1); }
console.log('bundle-budget: within budget');
