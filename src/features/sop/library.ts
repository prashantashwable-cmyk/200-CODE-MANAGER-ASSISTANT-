/**
 * The SOP repository's rules, pure (153). The repository is a reading view over the governed procedures (installation, delivery, safety and quality
 * checks), never a copy, so its job is to describe: which version is in force, which is only announced, what moved between two versions, and
 * whether a copy saved on a phone has fallen behind. The screen and the repository read these same functions.
 */
import type { SopError, SopReferenceInput } from '@/data/repository';

export const BUILT_IN_CATEGORIES = ['installation', 'delivery', 'safety', 'quality'] as const;
export type BuiltInCategory = (typeof BUILT_IN_CATEGORIES)[number];
/** Standards that live in the app's own rules (the safety checks, the quality checks) have one fixed version, dated from the first release. */
export const BUILT_IN_SINCE = '2026-01-01T00:00:00.000Z';
export const TITLE_MIN = 3;
export const NAME_MIN = 2;
export const NOTE_MIN = 10;
export const PAGE = 20;

const ms = (iso: string) => Date.parse(iso);
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;

/** The version in force at `now`: the latest whose day has arrived. */
export function currentOf<V extends { version: number; effectiveFrom: string }>(versions: V[], now: number): V | null {
  return [...versions].filter((v) => ms(v.effectiveFrom) <= now).sort((a, b) => b.version - a.version)[0] ?? null;
}

/** The next version that has been announced but has not taken effect yet. */
export function upcomingOf<V extends { version: number; effectiveFrom: string }>(versions: V[], now: number): V | null {
  return [...versions].filter((v) => ms(v.effectiveFrom) > now).sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))[0] ?? null;
}

export type VersionState = 'current' | 'upcoming' | 'past';
export function stateOf<V extends { version: number; effectiveFrom: string }>(v: V, versions: V[], now: number): VersionState {
  if (ms(v.effectiveFrom) > now) return 'upcoming';
  return currentOf(versions, now)?.version === v.version ? 'current' : 'past';
}

export interface Fingerprinted {
  id: string;
  fingerprint: string;
}

/** What moved from one version to the next, by step: steps keep their id across versions, so a changed wording is "changed", not "removed and added". */
export function diffItems(prev: Fingerprinted[], next: Fingerprinted[]): { added: string[]; removed: string[]; changed: string[] } {
  const before = new Map(prev.map((i) => [i.id, i.fingerprint]));
  const after = new Map(next.map((i) => [i.id, i.fingerprint]));
  return {
    added: next.filter((i) => !before.has(i.id)).map((i) => i.id),
    removed: prev.filter((i) => !after.has(i.id)).map((i) => i.id),
    changed: next.filter((i) => before.has(i.id) && before.get(i.id) !== i.fingerprint).map((i) => i.id),
  };
}

export type CopyState = 'current' | 'stale' | 'unknown';
/**
 * Whether a copy saved on the phone is still the one in force. A copy carries every version it knew of, so what was in force at `now` is read from
 * the copy itself (an announced version that has since taken effect counts); it is stale only when the library, which is the truth, knows of a
 * version the copy never saw. With no library to compare to (no signal, nothing cached) it says so rather than guessing.
 */
export function copyStateOf(copyVersions: { version: number; effectiveFrom: string }[], libraryCurrent: number | null, now: number): CopyState {
  if (libraryCurrent === null) return 'unknown';
  const mine = currentOf(copyVersions, now)?.version ?? 0;
  return mine >= libraryCurrent ? 'current' : 'stale';
}

export function categoryProblem(name: string, existing: string[]): SopError | null {
  if (letters(name) < NAME_MIN) return 'name_required';
  if (existing.some((e) => e.trim().toLowerCase() === name.trim().toLowerCase())) return 'name_taken';
  return null;
}

/** A reference document needs a title, at least one step, and any other language written for every step or none. */
export function referenceProblem(input: SopReferenceInput, ctx: { categoryIds: string[]; previousEffective: string | null; now: number }): SopError | null {
  if (!ctx.categoryIds.includes(input.categoryId)) return 'category_unknown';
  if (letters(input.title.en) < TITLE_MIN) return 'title_required';
  const en = input.steps.en.filter((s) => letters(s) > 0);
  if (en.length === 0) return 'steps_required';
  for (const lang of ['hi', 'mr'] as const) {
    const other = input.steps[lang].filter((s) => letters(s) > 0);
    if (other.length > 0 && other.length !== en.length) return 'translation_mismatch';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveFrom) || Number.isNaN(ms(input.effectiveFrom))) return 'date_invalid';
  const today = new Date(ctx.now).toISOString().slice(0, 10);
  if (input.effectiveFrom < today) return 'date_in_past';
  if (ctx.previousEffective && input.effectiveFrom < ctx.previousEffective.slice(0, 10)) return 'date_in_past';
  if (input.docId && letters(input.changeNote) < NOTE_MIN) return 'note_required';
  return null;
}
