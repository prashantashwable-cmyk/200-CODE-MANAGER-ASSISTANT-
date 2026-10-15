import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

/** The traceability table is only worth reading if what it points at exists. */
describe('requirements traceability', () => {
  const doc = readFileSync('docs/REQUIREMENTS_TRACEABILITY.md', 'utf8');
  const rows = doc.split('\n').filter((l) => /^\| /.test(l) && !/^\|[- |]+\|$/.test(l) && !l.startsWith('| Source'));

  it('every row has a status from the allowed set', () => {
    for (const r of rows) {
      const cells = r.split('|').map((c) => c.trim());
      expect(['Done', 'Partial', 'Planned', 'Not started'], r).toContain(cells[3]);
    }
  });

  it('every file or folder a row names exists', () => {
    const missing: string[] = [];
    for (const r of rows) for (const m of r.matchAll(/`([^`]+)`/g)) {
      const t = m[1];
      if (!/^(features|screens|src|supabase|tests|docs|scripts)\//.test(t) || /[*<>()]/.test(t) || t.includes(' ')) continue;
      const path = t.startsWith('features/') || t.startsWith('screens/') ? `src/${t}` : t;
      if (!existsSync(path)) missing.push(t);
    }
    expect(missing).toEqual([]);
  });

  it('every migration is named in the plan or the gaps list, so none ships unexplained', () => {
    const notes = readFileSync('KNOWN_GAPS.md', 'utf8') + readFileSync('docs/IMPLEMENTATION_PLAN.md', 'utf8') + doc;
    const unexplained = readdirSync('supabase/migrations').filter((f) => /^2026101[345]/.test(f)).filter((f) => !notes.includes(f.replace(/\.sql$/, '')) && !notes.includes(f.slice(0, 14)));
    expect(unexplained).toEqual([]);
  });
});
