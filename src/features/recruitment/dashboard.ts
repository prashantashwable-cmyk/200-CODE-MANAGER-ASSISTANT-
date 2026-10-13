/**
 * The recruitment overview's maths, pure (147). It is the same funnel idea as the sales funnel (022) applied to people: how many reached each
 * stage, how many carried on, how long it took, and where an unusual share fell away. The territory half reads the same coverage data the
 * territories screen (015) does, so recruiting follows real operating need and not a guess.
 */
import { days } from '@/features/sla/clock';

export const PERIODS = [30, 90, 0] as const;
export type Period = (typeof PERIODS)[number];
export const FUNNEL = ['interested', 'applied', 'forward', 'verified', 'offered', 'activated'] as const;
export type RecruitStage = (typeof FUNNEL)[number];
export const NOW_STAGES = ['interested', 'form', 'screening', 'interviewing', 'verifying', 'offer', 'waitlisted', 'activated'] as const;
export type NowStage = (typeof NOW_STAGES)[number];

/** Below this many people reaching a stage, a percentage is more noise than signal. */
export const SMALL_SAMPLE = 5;
/** A step that keeps fewer than this share of those before it is worth looking at (placeholder). */
export const FLAG_BELOW = 0.6;
/** Need at or above this share of the busiest zone's is urgent; interest at or below this many applicants is low (placeholders). */
export const URGENT_NEED = 75;
export const LOW_INTEREST = 1;
/** How many leads a surveyor can keep busy at once: the room left in a zone is what it needs less who already work it (placeholder). */
export const LEADS_PER_SURVEYOR = 4;
export const WAITLIST_REVIEW = days(30);
export const WAITLIST_MIN = 15;

export const medianOf = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export interface FunnelRow {
  stage: RecruitStage;
  reached: number;
  /** Share of those at the stage before that carried on, null for the first or when there were too few to say. */
  conversion: number | null;
  smallSample: boolean;
  flagged: boolean;
}

/** The funnel from cumulative counts, flagging the one step that lost an unusual share (the lowest, if it falls under `FLAG_BELOW`). */
export function funnelOf(reached: Record<RecruitStage, number>): FunnelRow[] {
  const rows = FUNNEL.map((stage, i): FunnelRow => {
    const prev = i === 0 ? 0 : reached[FUNNEL[i - 1]];
    return { stage, reached: reached[stage], conversion: i === 0 || prev === 0 ? null : reached[stage] / prev, smallSample: i > 0 && prev < SMALL_SAMPLE, flagged: false };
  });
  const candidates = rows.filter((r) => r.conversion !== null && !r.smallSample && (r.conversion as number) < FLAG_BELOW);
  const worst = candidates.sort((a, b) => (a.conversion as number) - (b.conversion as number))[0];
  if (worst) worst.flagged = true;
  return rows;
}

export const roomOf = (leads: number, people: number): number => Math.max(0, Math.ceil(leads / LEADS_PER_SURVEYOR) - people);

export type TerritorySignal = 'urgent_low_interest' | 'urgent' | 'full' | 'balanced';
/** Urgent need with hardly any applicants is its own, louder case; a zone with no room left is not asking for more people. */
export function signalOf(need: number, pipeline: number, room: number): TerritorySignal {
  if (room <= 0) return 'full';
  if (need >= URGENT_NEED) return pipeline <= LOW_INTEREST ? 'urgent_low_interest' : 'urgent';
  return 'balanced';
}

/** A change against a handful of people last time is noise, so no percentage until there were a few. */
export const TREND_MIN = 3;
export const trendOf = (now: number, before: number): number | null => (before < TREND_MIN ? null : Math.round(((now - before) / before) * 100));
