/**
 * Setting a contest up, pure (167). The screen and the repository judge the same input with the same rules, so what Admin is told is wrong before saving is exactly what the
 * repository would refuse, and the preview's cautions are the same ones whoever reads them. Nothing here is stored.
 *
 * Every limit below is a placeholder business decision, flagged to Admin on screen.
 */
import { days } from '@/features/sla/clock';
import { METRICS_OF } from './standings';
import type { ContestMetric } from './standings';

export const NAME_MIN = 3;
export const NAME_MAX = 60;
export const DESCRIPTION_MAX = 300;
export const MIN_DAYS = 1;
export const MAX_DAYS = 120;
export const MAX_PLACES = 5;
/** The most cash one place can carry (placeholder): a prize beyond this is a decision for the owner, not a form field. */
export const MAX_CASH = 100_000;
export const LABEL_MIN = 3;
export const LABEL_MAX = 60;
/** Why a contest is ended early must be said in words that can be shown to the people in it. */
export const END_REASON_MIN = 20;
export const MAX_TENURE_DAYS = 730;
export const PREVIEW_SHOWN = 8;
/** A contest that starts within this long of now starts at once, rather than being a "scheduled" one with a clock nobody will see. */
export const START_NOW_SLACK = 5 * 60_000;

export interface RewardInput { rank: number; kind: 'cash' | 'recognition'; amount?: number; label?: string }
export interface ContestInput {
  name: string;
  description: string;
  cohort: 'surveyor' | 'technician';
  metric: ContestMetric;
  startsAt: string;
  endsAt: string;
  rewards: RewardInput[];
  minTenureDays: number;
  allowLateJoiners: boolean;
}

export type ContestProblem =
  | 'name_short' | 'name_long' | 'description_long' | 'metric_invalid' | 'dates_invalid' | 'start_past' | 'too_short' | 'too_long'
  | 'no_rewards' | 'too_many_places' | 'ranks_invalid' | 'cash_invalid' | 'cash_too_high' | 'label_short' | 'label_long' | 'tenure_invalid';

const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length;

export function rewardsProblem(rewards: RewardInput[]): ContestProblem | null {
  if (rewards.length === 0) return 'no_rewards';
  if (rewards.length > MAX_PLACES) return 'too_many_places';
  const ranks = [...rewards].map((r) => r.rank).sort((a, b) => a - b);
  if (ranks.some((r, i) => r !== i + 1)) return 'ranks_invalid';
  for (const r of rewards) {
    if (r.kind === 'cash') {
      if (!Number.isFinite(r.amount) || (r.amount as number) <= 0 || !Number.isInteger(r.amount)) return 'cash_invalid';
      if ((r.amount as number) > MAX_CASH) return 'cash_too_high';
    } else {
      const n = letters(r.label ?? '');
      if (n < LABEL_MIN) return 'label_short';
      if ((r.label ?? '').trim().length > LABEL_MAX) return 'label_long';
    }
  }
  return null;
}

export function contestProblem(i: ContestInput, now: number, opts: { editing?: boolean } = {}): ContestProblem | null {
  if (letters(i.name) < NAME_MIN) return 'name_short';
  if (i.name.trim().length > NAME_MAX) return 'name_long';
  if (i.description.trim().length > DESCRIPTION_MAX) return 'description_long';
  if (!METRICS_OF[i.cohort].includes(i.metric)) return 'metric_invalid';
  const a = Date.parse(i.startsAt);
  const b = Date.parse(i.endsAt);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 'dates_invalid';
  if (!opts.editing && a < now - START_NOW_SLACK) return 'start_past';
  if (b - a < days(MIN_DAYS)) return 'too_short';
  if (b - a > days(MAX_DAYS)) return 'too_long';
  if (!Number.isInteger(i.minTenureDays) || i.minTenureDays < 0 || i.minTenureDays > MAX_TENURE_DAYS) return 'tenure_invalid';
  return rewardsProblem(i.rewards);
}

export const totalCash = (rewards: RewardInput[]): number => rewards.filter((r) => r.kind === 'cash').reduce((a, r) => a + (r.amount ?? 0), 0);
export const durationDays = (startsAt: string, endsAt: string): number => Math.round((Date.parse(endsAt) - Date.parse(startsAt)) / 86_400_000);

/** What a contest may still change: its rules are locked the moment it starts, so nobody competes under rules that moved. */
export const isLocked = (phase: 'scheduled' | 'active' | 'closed' | 'ended_early'): boolean => phase !== 'scheduled';

/** Cautions from scoring the contest as it stands today (nothing blocks: Admin decides). */
export type PreviewCheck = 'everyone_level' | 'one_dominates' | 'few_active' | 'overlaps' | 'counts_quantity';
export const DOMINATES_SHARE = 0.6;
export const FEW_ACTIVE = 2;
export function previewChecks(values: number[], metric: ContestMetric, overlapsLive: boolean): PreviewCheck[] {
  const out: PreviewCheck[] = [];
  const active = values.filter((v) => v > 0);
  const sum = values.reduce((a, v) => a + v, 0);
  if (values.length > 0 && active.length === 0) out.push('everyone_level');
  else if (active.length > 0 && active.length < FEW_ACTIVE + 1 && values.length > FEW_ACTIVE) out.push('few_active');
  if (sum > 0 && Math.max(...values) / sum >= DOMINATES_SHARE && active.length > 1) out.push('one_dominates');
  if (overlapsLive) out.push('overlaps');
  // Counting leads captured says nothing about whether they are good ones: a flag Admin should weigh, not a refusal.
  if (metric === 'leadsCaptured') out.push('counts_quantity');
  return out;
}

export type EarlyEndProblem = 'reason_short' | 'policy_invalid';
export const earlyEndProblem = (reason: string, policy: string): EarlyEndProblem | null => (letters(reason) < END_REASON_MIN ? 'reason_short' : policy !== 'pay' && policy !== 'none' ? 'policy_invalid' : null);

export const csvCell = (v: string | number): string => {
  const s = String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
