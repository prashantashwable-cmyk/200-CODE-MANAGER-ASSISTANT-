import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = '/home/user/aiec-200-screen-build/src/screens';
const dirs = readdirSync(ROOT).filter((d) => statSync(join(ROOT, d)).isDirectory() && /^\d{3}-/.test(d)).sort();

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);

const FAKE_LATENCY = /new Promise\(\s*\(resolve\)\s*=>\s*setTimeout\(resolve,\s*\d+\s*\)/;
const DISCLOSE = /stand-in|standIn|simulated|nothing is sent|nothing leaves the app|no provider receives|demo gateway|not connected|placeholder/i;

const rows = [];
for (const dir of dirs) {
  const files = walk(join(ROOT, dir));
  const code = files.filter((f) => /\.tsx?$/.test(f));
  let src = '';
  for (const f of code) src += readFileSync(f, 'utf8');

  const routeFile = files.find((f) => f.endsWith('route.tsx'));
  const route = routeFile ? readFileSync(routeFile, 'utf8') : '';
  const path = (route.match(/path:\s*'([^']+)'/) || [, ''])[1];
  const roles = (route.match(/roles:\s*(\[[^\]]*\]|'public')/) || [, ''])[1]
    .replace(/[[\]']/g, '').replace(/,\s*/g, '+');

  const repoCalls = new Set([...src.matchAll(/repository\.([a-zA-Z]+)\(/g)].map((m) => m[1]));
  const sCalls = new Set([...src.matchAll(/\bs\.([a-z][a-zA-Z]+)\(/g)].map((m) => m[1]));
  const calls = repoCalls.size + sCalls.size;

  const signals = [];
  if (FAKE_LATENCY.test(src)) signals.push('fake-latency');
  if (/localStorage\.setItem/.test(src)) signals.push('localStorage');
  const lsKeys = [...src.matchAll(/'(aiec\.[a-zA-Z.]+)'/g)].map((m) => m[1]);
  if (DISCLOSE.test(src)) signals.push('discloses-stand-in');
  if (/TODO|FIXME/.test(src)) signals.push('TODO');

  const states = ['LoadingState', 'ErrorState', 'EmptyState'].filter((c) => src.includes(c));

  let status;
  if (calls === 0) status = 'Static';
  else if (signals.includes('fake-latency')) status = 'Partial';
  else status = 'Real (in-memory)';

  rows.push({
    screen: dir.slice(0, 3),
    slug: dir.slice(4),
    path,
    roles,
    status,
    repo_calls: calls,
    states: states.map((s) => s.replace('State', '')).join('+') || 'none',
    signals: signals.join(';') || '-',
    ls_keys: [...new Set(lsKeys)].join(' '),
    loc: code.reduce((n, f) => n + readFileSync(f, 'utf8').split('\n').length, 0),
  });
}

const cols = ['screen', 'slug', 'path', 'roles', 'status', 'repo_calls', 'states', 'signals', 'ls_keys', 'loc'];
const esc = (v) => (/[",]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
console.log(cols.join(','));
for (const r of rows) console.log(cols.map((c) => esc(r[c])).join(','));

// summary to stderr
const by = {};
for (const r of rows) by[r.status] = (by[r.status] || 0) + 1;
console.error('STATUS:', JSON.stringify(by));
console.error('no-loading:', rows.filter((r) => !r.states.includes('Loading')).map((r) => r.screen).join(' '));
console.error('no-error:', rows.filter((r) => !r.states.includes('Error')).map((r) => r.screen).join(' '));
console.error('fake-latency:', rows.filter((r) => r.signals.includes('fake-latency')).map((r) => r.screen).join(' '));
console.error('static:', rows.filter((r) => r.status === 'Static').map((r) => r.screen + ' ' + r.slug).join(' | '));
console.error('TODO:', rows.filter((r) => r.signals.includes('TODO')).map((r) => r.screen).join(' '));
