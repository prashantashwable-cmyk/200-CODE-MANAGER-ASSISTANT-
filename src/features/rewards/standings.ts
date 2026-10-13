/**
 * Contest standings, pure (165). One ranking, read by every role: the partner's motivational view and Admin's own look must show exactly the same numbers, so both read
 * this file and the one repository computation that feeds it. Nothing here is stored.
 *
 * Ranking is the Worker Performance Leaderboard's own (024): the metric first, then the person's rating as the tiebreaker, so a tie is never an arbitrary coin toss.
 * Thresholds are placeholder business decisions, flagged to Admin on screen.
 */
import { days, hours } from '@/features/sla/clock';

/** What a contest can be competed on today. Rates (conversion, QC pass) are left to 167, where a perverse incentive can be weighed before it is offered. */
export const METRICS = ['leadsCaptured', 'leadsConverted', 'revenue', 'jobsCompleted'] as const;
export type ContestMetric = (typeof METRICS)[number];
export const METRICS_OF: Record<'surveyor' | 'technician', ContestMetric[]> = { surveyor: ['leadsCaptured', 'leadsConverted', 'revenue'], technician: ['jobsCompleted'] };

export type ContestPhase = 'scheduled' | 'active' | 'closed' | 'ended_early';
export const phaseOf = (c: { startsAt: string; endsAt: string; endedAt?: string }, now: number): ContestPhase =>
  c.endedAt ? 'ended_early' : now < Date.parse(c.startsAt) ? 'scheduled' : now >= Date.parse(c.endsAt) ? 'closed' : 'active';

/** Within this long of the end, standings can change fast, so the screen says so and refreshes quicker. */
export const CLOSING_SOON = hours(24);
export const LIVE_POLL_MS = 15_000;
export const CLOSING_POLL_MS = 5_000;
/** A correction that moved a number is still mentioned this long. */
export const CORRECTION_NOTE_DAYS = 7;
export const CORRECTION_NOTE_MS = days(CORRECTION_NOTE_DAYS);
export const SHOWN_TOP = 10;
export const MOVEMENTS_SHOWN = 6;

export const closingSoon = (endsAt: string, now: number): boolean => Date.parse(endsAt) - now <= CLOSING_SOON && Date.parse(endsAt) > now;

export interface RankInput { userId: string; value: number; rating: number }
export interface Ranked extends RankInput { rank: number }

/** The leaderboard's own order: the metric, then rating. Everyone gets a distinct place, so "next rank up" is always one person. */
export function rankAll(rows: RankInput[]): Ranked[] {
  return [...rows].sort((a, b) => b.value - a.value || b.rating - a.rating).map((r, i) => ({ ...r, rank: i + 1 }));
}

/**
 * How far someone is from the person directly above, and the smallest amount that actually takes the place (the metric moves in whole steps: one lead, one job, one rupee).
 * Level on the number, the rating decides: when it already favours the chaser, matching the number is enough.
 */
export function gapToAbove(me: Ranked, above: Ranked | null): { gap: number; toPass: number } | null {
  if (!above) return null;
  const gap = above.value - me.value;
  return { gap, toPass: gap === 0 ? (me.rating > above.rating ? 0 : 1) : me.rating > above.rating ? gap : gap + 1 };
}

/** Whether the person above is level with someone on the number and ahead only on rating (shown, so the order never looks arbitrary). */
export const tiedOnNumber = (a: Ranked, b: Ranked | undefined): boolean => !!b && a.value === b.value;

/** The smallest additional amount that puts someone at `targetRank` or better. null once they are there. */
export function toReachRank(me: Ranked, all: Ranked[], targetRank: number): number | null {
  if (me.rank <= targetRank) return null;
  const holder = all[targetRank - 1];
  if (!holder) return null;
  const g = gapToAbove(me, holder);
  return g ? g.toPass : null;
}

/** First name and the initial of the last, for other partners' rows (Admin sees full names). */
export const shortName = (name: string): string => {
  const p = name.trim().split(/\s+/);
  return p.length < 2 ? p[0] : `${p[0]} ${p[p.length - 1][0]}.`;
};

export interface TimeLeft { ms: number; days: number; hours: number; minutes: number }
export function timeLeft(endsAt: string, now: number): TimeLeft {
  const ms = Math.max(0, Date.parse(endsAt) - now);
  return { ms, days: Math.floor(ms / 86_400_000), hours: Math.floor((ms % 86_400_000) / 3_600_000), minutes: Math.floor((ms % 3_600_000) / 60_000) };
}
