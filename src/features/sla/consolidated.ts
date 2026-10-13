/**
 * One view over every SLA-governed process (185). Pure: it reads nothing, it only judges what the repository has already gathered from each process's own record and its own target,
 * so a number here is the number that process's own screen shows. Weights, windows and thresholds are placeholders flagged on the screen.
 */
import { businessMinutesSince, days } from './clock';

export type SlaCategory = 'reply' | 'service_ticket' | 'payment_dispute' | 'payout_dispute' | 'supplier_dispute' | 'delivery_delay';
export type SlaMeasure = 'business' | 'calendar';
export type SlaStatus = 'on_track' | 'at_risk' | 'breached' | 'met' | 'missed';

export interface SlaCategoryDef {
  id: SlaCategory;
  measure: SlaMeasure;
  /** What a missed deadline costs: a customer left waiting or money in question weighs more than a routine internal wait. Placeholder weights (1–5). */
  consequence: number;
  /** Where the process's own target and queue live. */
  route: string;
  /** True when the process already raises an alert of its own for a breach, so this screen links to it instead of raising a second one. */
  ownAlert: boolean;
}

export const SLA_CATEGORIES: SlaCategoryDef[] = [
  { id: 'reply', measure: 'business', consequence: 5, route: '/admin/comm/inbox', ownAlert: false },
  { id: 'service_ticket', measure: 'calendar', consequence: 4, route: '/service-requests', ownAlert: true },
  { id: 'payment_dispute', measure: 'calendar', consequence: 5, route: '/admin/analytics/collections/disputes', ownAlert: false },
  { id: 'payout_dispute', measure: 'calendar', consequence: 4, route: '/payout-dispute', ownAlert: true },
  { id: 'supplier_dispute', measure: 'calendar', consequence: 3, route: '/supplier-disputes', ownAlert: false },
  { id: 'delivery_delay', measure: 'calendar', consequence: 3, route: '/delivery-delays', ownAlert: true },
];
export const categoryDef = (id: string): SlaCategoryDef | undefined => SLA_CATEGORIES.find((c) => c.id === id);

/** One timer: what started it, what it is held to, and when (if ever) it ended. Everything else is worked out here. */
export interface SlaItem {
  id: string;
  category: SlaCategory;
  relatedId: string;
  route: string;
  label: string;
  startedAt: string;
  targetMs: number;
  endedAt: string | null;
  /** A fair pause the process's own rule applies right now (waiting on the customer, on hold). Time in it does not count. */
  pausedSince?: string | null;
  /** Time already spent in a fair pause. */
  pausedMs?: number;
}

export const AT_RISK_FROM = 0.75;
export const MIN_SAMPLE = 5;
/** Weeks drawn on the trend, and the weeks each half of the comparison covers. */
export const TREND_WEEKS = 8;
export const HALF_WEEKS = 4;
export const STEADY_POINTS = 5;
/** A target the typical closure uses almost all of, or hardly any of, is worth a second look. */
export const TIGHT_MEDIAN = 0.8;
export const LOOSE_MEDIAN = 0.2;

/** Time on the clock: business hours only for a business-measured process (nights do not count against it), minus any fair pause. */
export function elapsedMsOf(item: SlaItem, now: number): number {
  const end = item.endedAt ? Date.parse(item.endedAt) : now;
  const def = categoryDef(item.category);
  const raw = def?.measure === 'business' ? businessMinutesSince(item.startedAt, end) * 60_000 : end - Date.parse(item.startedAt);
  const paused = (item.pausedMs ?? 0) + (item.pausedSince && !item.endedAt ? Math.max(0, now - Date.parse(item.pausedSince)) : 0);
  return Math.max(0, raw - paused);
}
export const ratioOf = (item: SlaItem, now: number): number => elapsedMsOf(item, now) / Math.max(1, item.targetMs);

export function statusOf(item: SlaItem, now: number): SlaStatus {
  const r = ratioOf(item, now);
  if (item.endedAt) return r <= 1 ? 'met' : 'missed';
  return r >= 1 ? 'breached' : r >= AT_RISK_FROM ? 'at_risk' : 'on_track';
}

/** Why an open clock is standing still, said plainly: a process's own pause, or the night for a business-hours one. */
export type PauseReason = 'waiting_on_customer' | 'on_hold' | 'outside_hours';
export function pauseOf(item: SlaItem, now: number, reason: PauseReason | null): PauseReason | null {
  if (item.endedAt) return null;
  if (item.pausedSince) return reason ?? 'on_hold';
  if (categoryDef(item.category)?.measure === 'business') { const h = new Date(now).getHours(); if (h < 9 || h >= 19) return 'outside_hours'; }
  return null;
}

/** Triage: what a breach costs (its consequence) times how far past the target it is, so a long-overdue payment dispute outranks a reply that is a few minutes late. */
export function triageScore(item: SlaItem, now: number): number {
  const def = categoryDef(item.category);
  const r = ratioOf(item, now);
  return (def?.consequence ?? 1) * Math.max(0, r);
}

export interface CategoryRollup {
  category: SlaCategory;
  open: number;
  onTrack: number;
  atRisk: number;
  breached: number;
  /** Closures in the window judged against their target. */
  closed: number;
  met: number;
  /** Share met, or null with too few to say. */
  complianceRate: number | null;
  worstRatio: number;
}
export function rollupOf(items: SlaItem[], category: SlaCategory, now: number, sinceMs: number): CategoryRollup {
  const mine = items.filter((i) => i.category === category);
  const open = mine.filter((i) => !i.endedAt);
  const closed = mine.filter((i) => i.endedAt && Date.parse(i.endedAt) >= sinceMs);
  const met = closed.filter((i) => statusOf(i, now) === 'met').length;
  const st = open.map((i) => statusOf(i, now));
  return {
    category, open: open.length, onTrack: st.filter((s) => s === 'on_track').length, atRisk: st.filter((s) => s === 'at_risk').length, breached: st.filter((s) => s === 'breached').length,
    closed: closed.length, met, complianceRate: closed.length >= MIN_SAMPLE ? Math.round((met / closed.length) * 100) : null, worstRatio: open.reduce((m, i) => Math.max(m, ratioOf(i, now)), 0),
  };
}

export interface TrendPoint { weekStart: string; closed: number; met: number; rate: number | null }
export type TrendDirection = 'improving' | 'declining' | 'steady' | 'too_little';
const weekStartOf = (ms: number): number => { const d = new Date(ms); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };

/** Weekly compliance by the week a timer closed. A timer still open and already past its target counts as a miss in the week it went over, so a pile-up is not hidden by only counting finished work. */
export function trendOf(items: SlaItem[], category: SlaCategory, now: number): { points: TrendPoint[]; direction: TrendDirection } {
  const mine = items.filter((i) => i.category === category);
  const thisWeek = weekStartOf(now);
  const points: TrendPoint[] = [];
  for (let w = TREND_WEEKS - 1; w >= 0; w -= 1) {
    const start = thisWeek - w * days(7);
    const end = start + days(7);
    let closed = 0;
    let met = 0;
    for (const i of mine) {
      if (i.endedAt) {
        const at = Date.parse(i.endedAt);
        if (at >= start && at < end) { closed += 1; if (statusOf(i, now) === 'met') met += 1; }
      } else {
        // The moment it went over: start plus the time it was held to (a fair pause moves that later, so this is a lower bound on it).
        const wentOver = Date.parse(i.startedAt) + i.targetMs + (i.pausedMs ?? 0);
        if (statusOf(i, now) === 'breached' && wentOver >= start && wentOver < end) closed += 1;
      }
    }
    points.push({ weekStart: new Date(start).toISOString(), closed, met, rate: closed > 0 ? Math.round((met / closed) * 100) : null });
  }
  const half = (list: TrendPoint[]) => ({ closed: list.reduce((n, p) => n + p.closed, 0), met: list.reduce((n, p) => n + p.met, 0) });
  const recent = half(points.slice(-HALF_WEEKS));
  const before = half(points.slice(0, TREND_WEEKS - HALF_WEEKS));
  if (recent.closed < MIN_SAMPLE || before.closed < MIN_SAMPLE) return { points, direction: 'too_little' };
  const diff = Math.round((recent.met / recent.closed) * 100) - Math.round((before.met / before.closed) * 100);
  return { points, direction: diff >= STEADY_POINTS ? 'improving' : diff <= -STEADY_POINTS ? 'declining' : 'steady' };
}

export type TargetSignal = 'too_little' | 'fits' | 'tight' | 'loose';
/** Is the target itself worth reconsidering? Judged on how much of it closures usually use, never on a single breach: a target nearly everyone scrapes or misses may be unrealistic for today's volume, one nearly everyone beats by a mile may be too slack. */
export function targetSignal(items: SlaItem[], category: SlaCategory, now: number, sinceMs: number): { signal: TargetSignal; medianRatio: number | null; sample: number } {
  const closed = items.filter((i) => i.category === category && i.endedAt && Date.parse(i.endedAt) >= sinceMs);
  if (closed.length < MIN_SAMPLE) return { signal: 'too_little', medianRatio: null, sample: closed.length };
  const ratios = closed.map((i) => ratioOf(i, now)).sort((a, b) => a - b);
  const median = ratios[Math.floor(ratios.length / 2)];
  const missed = closed.filter((i) => statusOf(i, now) === 'missed').length / closed.length;
  return { signal: median >= TIGHT_MEDIAN || missed >= 0.4 ? 'tight' : median <= LOOSE_MEDIAN ? 'loose' : 'fits', medianRatio: Math.round(median * 100) / 100, sample: closed.length };
}

/** How the window the compliance and target judgements look back over is chosen (days). */
export const WINDOW_DAYS = 56;
