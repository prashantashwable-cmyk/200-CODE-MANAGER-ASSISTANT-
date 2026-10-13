/**
 * Screen 110's maths, pure. Delivery analytics keeps no data of its own: every figure is read off what the
 * checklists (103), damaged-parts reports (108), delay alerts (105), supplier ratings (097) and carrier trips
 * (109) already recorded. What lives here is only how to say "trend", "emerging" and "cost" once.
 */

const DAY = 86_400_000;

/** Fewer deliveries than this and an average is an early look, never a figure to plan on. */
export const MIN_SAMPLE = 5;
/** An incident count has to reach this before "rising" means anything. */
export const MIN_RISING_INCIDENTS = 2;
/** The comparison behind a "rising" flag: the latest window against the one before it. */
export const RISING_WINDOW_DAYS = 90;

/** What a day of installation delay costs AIEC (an idle crew, a customer's goodwill). An assumption Admin should
 *  tune to the business, kept here so the cost card and its explanation always say the same number. */
export const SCHEDULE_DELAY_COST_PER_DAY = 12_000;
/** What sending the crew back to fit a replacement costs. Same status: an assumption, stated on screen. */
export const REVISIT_COST = 3_500;

export type Direction = 'up' | 'down' | 'flat';
export type TrendTone = 'good' | 'bad' | 'neutral';

export interface Trend {
  direction: Direction;
  tone: TrendTone;
  /** Change as a percentage of the earlier value, or in points for a rate, per the caller. Null with nothing to compare. */
  delta: number | null;
}

/** `betterWhen`: whether a rise is good news (on-time rate) or bad (cost, incidents, transit time). */
export function trendOf(current: number | null, previous: number | null, betterWhen: 'higher' | 'lower', flatBelow = 0.5): Trend {
  if (current === null || previous === null) return { direction: 'flat', tone: 'neutral', delta: null };
  const delta = current - previous;
  if (Math.abs(delta) < flatBelow) return { direction: 'flat', tone: 'neutral', delta };
  const direction: Direction = delta > 0 ? 'up' : 'down';
  const good = betterWhen === 'higher' ? delta > 0 : delta < 0;
  return { direction, tone: good ? 'good' : 'bad', delta };
}

/** Percentage change of a plain amount, guarding a zero base. */
export const pctChange = (current: number, previous: number): number | null => (previous === 0 ? null : Math.round(((current - previous) / previous) * 100));

/* ------------------------------------------------------------------ periods */

/** `yyyy-mm` of a moment, in the site's own calendar month. */
export const monthKey = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** The last `count` month keys, oldest first, ending with the month of `now`. */
export function monthKeys(count: number, now: number): string[] {
  const end = new Date(now);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(end.getFullYear(), end.getMonth() - (count - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

/** Start of the first month in the window, as a moment. */
export const windowStart = (count: number, now: number): number => {
  const end = new Date(now);
  return new Date(end.getFullYear(), end.getMonth() - (count - 1), 1).getTime();
};

/** The `count` months before that window, the comparison for its trend. */
export const previousWindow = (count: number, now: number): { from: number; to: number } => {
  const to = windowStart(count, now);
  const end = new Date(to);
  return { from: new Date(end.getFullYear(), end.getMonth() - count, 1).getTime(), to };
};

/* -------------------------------------------------------------- disruptions */

export interface DisruptionWindow {
  startsOn: string;
  endsOn: string;
}

/** Whether a moment falls inside any annotated disruption (inclusive of both days). */
export function inDisruption(iso: string, windows: DisruptionWindow[]): boolean {
  const t = new Date(iso).getTime();
  return windows.some((w) => t >= new Date(`${w.startsOn}T00:00:00`).getTime() && t < new Date(`${w.endsOn}T00:00:00`).getTime() + DAY);
}

/* ----------------------------------------------------------------- on time */

export interface DeliveryFact {
  at: string;
  onTime: boolean;
  /** Late for a reason nobody controlled (105's external event), or on the day of a disruption. */
  setAside: boolean;
}

export interface Bucket {
  key: string;
  total: number;
  onTime: number;
  /** The same, with deliveries a disruption explains set aside, so a bad month is read for what it was. */
  totalExcl: number;
  onTimeExcl: number;
  setAside: number;
}

export function bucketsOf(facts: DeliveryFact[], keys: string[]): Bucket[] {
  return keys.map((key) => {
    const inMonth = facts.filter((f) => monthKey(f.at) === key);
    const kept = inMonth.filter((f) => !f.setAside);
    return { key, total: inMonth.length, onTime: inMonth.filter((f) => f.onTime).length, totalExcl: kept.length, onTimeExcl: kept.filter((f) => f.onTime).length, setAside: inMonth.length - kept.length };
  });
}

export const pctOf = (part: number, whole: number): number | null => (whole === 0 ? null : Math.round((part / whole) * 100));

/* ----------------------------------------------------------------- transit */

export interface TransitSummary {
  trips: number;
  avgHours: number | null;
  medianHours: number | null;
  p80Hours: number | null;
  /** Too few to plan a promise on: shown as an early look, never as a precise figure. */
  emerging: boolean;
  /** What to tell a customer: the day count that eight of ten trips beat, or null while emerging. */
  suggestedDays: number | null;
}

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx];
};

export function transitSummary(hours: number[]): TransitSummary {
  const sorted = [...hours].sort((a, b) => a - b);
  const trips = sorted.length;
  if (trips === 0) return { trips, avgHours: null, medianHours: null, p80Hours: null, emerging: true, suggestedDays: null };
  const avg = sorted.reduce((a, b) => a + b, 0) / trips;
  const p80 = percentile(sorted, 0.8);
  const emerging = trips < MIN_SAMPLE;
  return {
    trips,
    avgHours: Math.round(avg * 10) / 10,
    medianHours: Math.round(percentile(sorted, 0.5) * 10) / 10,
    p80Hours: Math.round(p80 * 10) / 10,
    emerging,
    // A promise is made in whole days, and on the transit only: production and dispatch are a separate promise.
    suggestedDays: emerging ? null : Math.max(1, Math.ceil(p80 / 24)),
  };
}

/* --------------------------------------------------------------- incidents */

export interface IncidentFact {
  at: string;
  key: string;
}

/** Whether incidents are climbing: the latest window against the one before, with enough evidence to say so. */
export function isRising(recent: number, prior: number): boolean {
  return recent >= MIN_RISING_INCIDENTS && recent > prior;
}

export const inLast = (iso: string, days: number, now: number) => now - new Date(iso).getTime() <= days * DAY && new Date(iso).getTime() <= now;
export const inPriorWindow = (iso: string, days: number, now: number) => {
  const age = now - new Date(iso).getTime();
  return age > days * DAY && age <= 2 * days * DAY;
};

/* -------------------------------------------------------------------- cost */

export interface IncidentCostInput {
  value: number;
  attribution: 'supplier' | 'transport' | 'installation' | null;
  resolution: 'reported' | 'replacement_requested' | 'replacement_shipped' | 'resolved' | 'credited';
  creditAmount?: number;
  scheduleDelayDays?: number;
  status: 'open' | 'resolved' | 'withdrawn';
}

export interface IncidentCost {
  /** Parts AIEC pays for again because the fault was not the supplier's. */
  parts: number;
  /** The crew's return visit to fit a replacement. */
  rework: number;
  /** Days the installation slipped, priced. */
  schedule: number;
  total: number;
  /** Value at stake while no one has yet judged whose fault it is. Not a cost, so never added to one. */
  exposure: number;
}

/**
 * One incident, one cost, worked out from that incident alone. Money already held back from a supplier's
 * payment retention over the same fault is a separate ledger and is deliberately never read here, so a
 * report can never be counted once as an issue and again as a retention adjustment.
 */
export function costOf(i: IncidentCostInput): IncidentCost {
  if (i.status === 'withdrawn') return { parts: 0, rework: 0, schedule: 0, total: 0, exposure: 0 };
  const replaced = i.resolution === 'replacement_requested' || i.resolution === 'replacement_shipped' || i.resolution === 'resolved';
  const parts = i.attribution && i.attribution !== 'supplier' ? (i.resolution === 'credited' ? Math.max(0, i.value - (i.creditAmount ?? 0)) : i.value) : 0;
  const rework = replaced ? REVISIT_COST : 0;
  const schedule = Math.max(0, i.scheduleDelayDays ?? 0) * SCHEDULE_DELAY_COST_PER_DAY;
  return { parts, rework, schedule, total: parts + rework + schedule, exposure: !i.attribution && i.status === 'open' ? i.value : 0 };
}
