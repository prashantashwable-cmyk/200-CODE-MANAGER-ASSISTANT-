/**
 * The event rules live twice: in TypeScript (the in-memory build and the screens) and in SQL (the database that enforces them).
 * If the two lists ever differ, one of them is wrong. This reads the migration and compares.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { LOCKED_TYPES, MONEY_OR_RANK_TYPES, CORRECTION_WINDOW_MS } from '@/features/events/eventLog';
import { EVENT_TYPES } from '@/features/events/taxonomy';

const sql = readFileSync('supabase/migrations/20261013000002_platform_events.sql', 'utf8');
const listIn = (fn: string): string[] => {
  const m = new RegExp(`function app\\.${fn}\\(t text\\)[\\s\\S]*?array\\[([^\\]]*)\\]`).exec(sql);
  if (!m) throw new Error(`${fn} not found in the migration`);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
};

describe('event rules: SQL and TypeScript agree', () => {
  it('the locked (class 4) types are the same list', () => {
    expect(listIn('event_locked')).toEqual([...LOCKED_TYPES].sort());
  });
  it('the money / rank / ownership (class 3) types are the same list', () => {
    expect(listIn('event_money_or_rank')).toEqual([...MONEY_OR_RANK_TYPES].sort());
  });
  it('every listed type is a real event type', () => {
    for (const t of [...LOCKED_TYPES, ...MONEY_OR_RANK_TYPES]) expect(EVENT_TYPES).toContain(t);
  });
  it('the correction window is the same 15 minutes', () => {
    expect(CORRECTION_WINDOW_MS).toBe(15 * 60_000);
    expect(sql).toContain("interval '15 minutes'");
  });
});
