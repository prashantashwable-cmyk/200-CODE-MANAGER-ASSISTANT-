#!/usr/bin/env node
/**
 * No-mock guard: fails the build when application code fakes something.
 *
 * Scans src/ (seed data excluded: it is example data by definition) for the patterns
 * that have stood in for real work in this codebase before: invented numbers, fake waits,
 * dead links and buttons, stray debugging and placeholder text. A line that genuinely needs
 * one of them says why with a trailing `// no-mock-guard: <reason>` comment.
 *
 * Usage: node scripts/no-mock-guard.mjs   (exit code 1 on any finding)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const SRC = join(root, 'src');

/** Example data, not behaviour. */
const SKIP_FILE = [/^src\/data\/seed\.ts$/, /^src\/data\/\w+Seed\.ts$/, /\.i18n\.ts$/];

const RULES = [
  { id: 'random', re: /\bMath\.random\s*\(/, why: 'a number invented at random (use real data, or crypto for ids: @/features/ids/clientId)' },
  { id: 'fake-wait', re: /new Promise\s*\(\s*\(?\s*(\w+)\s*\)?\s*=>\s*(?:window\.)?setTimeout\s*\(\s*\1\b/, why: 'a timer standing in for work' },
  { id: 'id-derived-number', re: /\.charCodeAt\s*\(\s*0\s*\)\s*[+%*]/, why: 'a number derived from an id' },
  { id: 'placeholder-text', re: /\b(lorem ipsum|faker\.|dummy data)\b/i, why: 'placeholder text' },
  { id: 'dead-link', re: /href=["']#["']/, why: 'a link that goes nowhere' },
  { id: 'dead-button', re: /onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/, why: 'a button that does nothing' },
  { id: 'browser-alert', re: /(^|[^.\w])alert\s*\(/, why: 'a browser alert() instead of the design system' },
  { id: 'console-log', re: /\bconsole\.log\s*\(/, why: 'stray debugging output' },
  { id: 'todo', re: /\b(TODO|FIXME|XXX)\b/, why: 'unfinished work left in code' },
];

const ALLOW = /\/\/\s*no-mock-guard:\s*\S/;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(name)) yield full;
  }
}

const findings = [];
for (const file of walk(SRC)) {
  const rel = relative(root, file).split('\\').join('/');
  if (SKIP_FILE.some((re) => re.test(rel))) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (ALLOW.test(line)) return;
    for (const rule of RULES) {
      if (rule.re.test(line)) findings.push(`${rel}:${i + 1}  [${rule.id}] ${rule.why}\n    ${line.trim().slice(0, 140)}`);
    }
  });
}

if (findings.length) {
  console.error(`no-mock-guard: ${findings.length} finding(s)\n`);
  console.error(findings.join('\n'));
  console.error('\nFix the code, or if a line is genuinely needed, end it with  // no-mock-guard: <reason>');
  process.exit(1);
}
console.log('no-mock-guard: clean');
