/**
 * The applicant screening score, pure (143). It is the same idea as the lead score (046): an automated first look that is explainable down to
 * each factor, adjustable by weight, frozen once a decision is made, and never the last word. A person decides; the score only says where to
 * look first. The weights are AIEC's own placeholder business decision, adjustable on the screen.
 */
import type { ApplicationForm } from '@/data/types';
import { days } from '@/features/sla/clock';
import type { RecruitRole } from './interest';
import type { SectionState } from './application';

export const FACTORS = ['completeness', 'experience', 'territory', 'availability', 'references'] as const;
export type Factor = (typeof FACTORS)[number];
export type Weights = Record<Factor, number>;
export const DEFAULT_WEIGHTS: Weights = { completeness: 20, experience: 30, territory: 25, availability: 10, references: 15 };
export const WEIGHT_MAX = 60;

/** How long an application should wait for a first look before Admin is reminded (placeholder). */
export const SCREEN_DUE = days(3);
/** A weighting change that moves this share of the queue by three places or more needs a second, deliberate confirmation. */
export const RESHUFFLE_SHARE = 0.3;
/** Fewer rated outcomes than this and the score is not second-guessed from them. */
export const MIN_OUTCOMES = 5;
/** How long someone moved forward should have worked with AIEC before their outcome is asked for (placeholder). */
export const RATE_AFTER = days(30);
export const ADJUST_MIN = -30;
export const ADJUST_MAX = 30;
export const REASON_MIN = 20;

export const DECLINE_REASONS = ['not_hiring', 'area_covered', 'more_experience', 'incomplete_details'] as const;
export type DeclineReason = (typeof DECLINE_REASONS)[number];

export interface FactorValue {
  value: number;
  /** What the number is made of, as small codes the screen words in the active language. */
  detail: Record<string, number | string>;
}

const YEARS_POINTS: Record<string, number> = { none: 0, under_1: 25, '1_3': 40, '3_5': 52, over_5: 60 };
const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;

export interface ScreeningInputs {
  role: RecruitRole;
  form: ApplicationForm;
  sections: SectionState[];
  /** 0 to 100: how much AIEC needs what this person offers where they offer it (computed from coverage, not typed in). */
  need: number;
  /** What the need was read from (the zone and its leads per person, or the scarce part category), for the breakdown. */
  needDetail?: Record<string, number | string>;
  now: Date;
}

export function factorValues(i: ScreeningInputs): Record<Factor, FactorValue> {
  const f = i.form;
  const done = i.sections.filter((s) => s.complete).length;
  // The five required sections are worth 80% and the optional references 20%, so a complete form scores 100 whether or not it has references.
  const req = i.sections.filter((s) => s.required);
  const reqDone = req.filter((s) => s.complete).length;
  const refsDone = i.sections.find((s) => s.id === 'references')?.complete ? 1 : 0;
  const completeness = Math.round((reqDone / req.length) * 85 + refsDone * 15);

  const choices = i.role === 'surveyor' ? f.experience.sectors.length : f.experience.skills.length;
  const yearsPts = YEARS_POINTS[f.experience.years] ?? 0;
  const choicesPts = Math.round((Math.min(choices, 3) / 3) * 25);
  const words = letters(f.experience.summary);
  const wordsPts = words >= 120 ? 15 : words >= 60 ? 10 : words >= 20 ? 6 : 0;
  const experience = Math.min(100, yearsPts + choicesPts + wordsPts);

  const hours = Number(f.availability.hoursPerWeek) || 0;
  const startIn = f.availability.earliestStart ? Math.max(0, Math.round((new Date(`${f.availability.earliestStart}T12:00:00Z`).getTime() - i.now.getTime()) / 86_400_000)) : 99;
  const hoursPts = Math.min(60, Math.round((hours / 40) * 60));
  const daysPts = Math.min(20, f.availability.days.length * 4);
  const startPts = startIn <= 14 ? 20 : startIn <= 30 ? 10 : 0;
  const availability = Math.min(100, hoursPts + daysPts + startPts);

  const refs = f.references;
  const verified = refs.filter((r) => r.outcome?.status === 'verified').length;
  const unchecked = refs.filter((r) => !r.outcome).length;
  const bad = refs.length - verified - unchecked;
  const references = refs.length === 0 ? 0 : Math.round((verified * 100 + unchecked * 50 + bad * 20) / refs.length);

  return {
    completeness: { value: completeness, detail: { done, total: i.sections.length } },
    experience: { value: experience, detail: { years: f.experience.years || 'none', choices, words: words >= 20 ? 1 : 0 } },
    territory: { value: Math.round(i.need), detail: { need: Math.round(i.need), ...(i.needDetail ?? {}) } },
    availability: { value: availability, detail: { hours, days: f.availability.days.length, startIn: startIn === 99 ? -1 : startIn } },
    references: { value: references, detail: { total: refs.length, verified, unchecked, bad } },
  };
}

export interface ScoredRow {
  key: Factor;
  weight: number;
  value: number;
  contribution: number;
  detail: Record<string, number | string>;
}

export function scoreOf(values: Record<Factor, FactorValue>, weights: Weights): { score: number; rows: ScoredRow[] } {
  const rows = FACTORS.map((key): ScoredRow => ({ key, weight: weights[key], value: values[key].value, contribution: (weights[key] * values[key].value) / 100, detail: values[key].detail }));
  return { score: Math.round(rows.reduce((s, r) => s + r.contribution, 0)), rows };
}

export type WeightsProblem = 'sum_not_100' | 'out_of_range';
export function weightsProblem(w: Weights): WeightsProblem | null {
  if (FACTORS.some((k) => !Number.isInteger(w[k]) || w[k] < 0 || w[k] > WEIGHT_MAX)) return 'out_of_range';
  if (FACTORS.reduce((s, k) => s + w[k], 0) !== 100) return 'sum_not_100';
  return null;
}

/** The share of a ranking that would move by three places or more under another weighting. */
export function reshuffleShare(before: string[], after: string[]): number {
  if (before.length === 0) return 0;
  const moved = before.filter((id, i) => Math.abs(i - after.indexOf(id)) >= 3).length;
  return moved / before.length;
}

export const clampScore = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export type AdjustProblem = 'adjust_range' | 'reason_required' | null;
export function adjustProblem(points: number, reason: string): AdjustProblem {
  if (!Number.isInteger(points) || points < ADJUST_MIN || points > ADJUST_MAX || points === 0) return 'adjust_range';
  return letters(reason) < REASON_MIN ? 'reason_required' : null;
}

/** What the people who turned out strong had in common, read from rated outcomes: where the score and the real result disagree. */
export function feedbackOf(rated: { rating: 'strong' | 'steady' | 'weak'; values: Record<Factor, number> }[]): { enough: boolean; perFactor: { key: Factor; strong: number | null; weak: number | null; gap: number | null }[]; suggest: Factor | null } {
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const strong = rated.filter((r) => r.rating === 'strong');
  const weak = rated.filter((r) => r.rating === 'weak');
  const perFactor = FACTORS.map((key) => {
    const s = avg(strong.map((r) => r.values[key]));
    const w = avg(weak.map((r) => r.values[key]));
    return { key, strong: s, weak: w, gap: s !== null && w !== null ? s - w : null };
  });
  const enough = rated.length >= MIN_OUTCOMES && strong.length > 0 && weak.length > 0;
  const best = [...perFactor].filter((p) => p.gap !== null).sort((a, b) => (b.gap as number) - (a.gap as number))[0];
  return { enough, perFactor, suggest: enough && best && (best.gap as number) >= 15 ? best.key : null };
}
