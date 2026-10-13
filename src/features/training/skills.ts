/**
 * The skill matrix's rules, pure (157). The matrix synthesises what the rest of the app already knows: the skill tags a technician carries from onboarding,
 * the certifications that training issues, and the drive types the pipeline of quotations is asking for. It is honest about small numbers: with a handful of
 * technicians a percentage is noise, so counts are shown and a gap is judged on counts. Nothing is invented: a technology with no skill tag yet reads as
 * "not tracked", never as zero supply.
 *
 * THE MAPPING OF DRIVE TYPE TO SKILL TAG, THE THRESHOLDS AND THE WINDOWS BELOW ARE PLACEHOLDER DECISIONS flagged to Admin on screen.
 */
import type { DriveType } from '@/data/types';

/** The skill tags technician onboarding (006) records, which 131 and 149 also read. */
export const SKILL_TAGS = ['mechanical', 'electrical', 'safety_rescue', 'mrl_gearless', 'hydraulic'] as const;
export type SkillTag = (typeof SKILL_TAGS)[number];

/** Which skill tag a drive type needs. A technology with no tag (null) cannot be counted yet: the matrix says so rather than showing zero. */
export const DRIVE_SKILL: Record<DriveType, SkillTag | null> = {
  hydraulic: 'hydraulic',
  geared_traction: 'mechanical',
  gearless_traction: 'mrl_gearless',
  mrl: 'mrl_gearless',
  vacuum: null,
  screw_driven: null,
};
export const DRIVE_TYPES: DriveType[] = ['geared_traction', 'gearless_traction', 'mrl', 'hydraulic', 'vacuum', 'screw_driven'];

/** With fewer technicians than this, a percentage is noise: counts are shown and gaps are judged on counts. */
export const SMALL_WORKFORCE = 8;
/** With fewer deals than this asking for a technology, the ratio is not read as a trend. */
export const SMALL_DEMAND = 3;
/** A column is a gap when fewer than this share are qualified (only judged on a workforce that is not small). */
export const GAP_BELOW = 0.5;
/** Deals per qualified technician from which supply is stretched, and from which it is getting tight. */
export const STRETCHED_AT = 2;
export const TIGHT_AT = 1;
export const TREND_MONTHS = 6;
/** A coverage change smaller than this many points is "flat". */
export const TREND_FLAT_POINTS = 3;
/** Assignments are due within this many days. */
export const ASSIGN_MAX_DAYS = 180;
export const NOTE_MAX = 400;

export const coverageOf = (held: number, total: number): number | null => (total > 0 ? Math.round((held / total) * 100) : null);

/** A column is a gap when nobody holds it, when one person is the only holder (a single point of dependency), or, on a workforce big enough to read, below the share. */
export function columnGap(held: number, total: number): boolean {
  if (total === 0) return false;
  if (held === 0 || held === 1) return true;
  return total >= SMALL_WORKFORCE && held / total < GAP_BELOW;
}

export type DemandSignal = 'untracked' | 'no_supply' | 'stretched' | 'tight' | 'covered' | 'no_demand';
/** Demand for a drive type against the people qualified for it. Untracked (no skill tag exists) is its own state, never read as nobody. */
export function demandSignal(deals: number, supply: number, tracked: boolean): DemandSignal {
  if (deals === 0) return 'no_demand';
  if (!tracked) return 'untracked';
  if (supply === 0) return 'no_supply';
  const ratio = deals / supply;
  return ratio >= STRETCHED_AT ? 'stretched' : ratio >= TIGHT_AT ? 'tight' : 'covered';
}
export const demandRatio = (deals: number, supply: number): number | null => (supply > 0 ? Math.round((deals / supply) * 10) / 10 : null);

export type TrendDirection = 'up' | 'down' | 'flat';
export function trendOf(points: (number | null)[]): { direction: TrendDirection; delta: number | null } {
  const known = points.filter((p): p is number => p !== null);
  if (known.length < 2) return { direction: 'flat', delta: null };
  const delta = known[known.length - 1] - known[0];
  return { direction: delta >= TREND_FLAT_POINTS ? 'up' : delta <= -TREND_FLAT_POINTS ? 'down' : 'flat', delta };
}

export type AssignProblem = 'date_invalid' | 'date_in_past' | 'date_far' | 'note_long';
export function assignProblem(dueDate: string, note: string, now: number): AssignProblem | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(dueDate))) return 'date_invalid';
  if (dueDate < new Date(now).toISOString().slice(0, 10)) return 'date_in_past';
  if (Date.parse(dueDate) - now > ASSIGN_MAX_DAYS * 86_400_000) return 'date_far';
  if (note.length > NOTE_MAX) return 'note_long';
  return null;
}
