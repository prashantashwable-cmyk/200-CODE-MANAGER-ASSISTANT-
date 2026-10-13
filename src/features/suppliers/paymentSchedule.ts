/**
 * Screen 114's forward view of supplier payments, pure. It is a read over the same milestone-linked data as 111 and 112,
 * never a plan of its own: each item is either a payment that has really fired and not yet gone out, or the part of an
 * order's split whose milestone has not happened, dated from where that milestone now realistically is.
 * The Financial Overview's upcoming-outflows figure is `outflowTotals` of the same items, so the two cannot disagree.
 */
import { addDaysKey, dateKey, parseKey, todayKey } from '@/features/logistics/deliverySlots';
import { startOfWeek } from '@/features/calendar/calendarMath';

/** `expected`: the milestone has not happened yet. The rest are real payments in 111: `owed` awaits a decision,
 *  `waiting` cannot be approved yet (no clean invoice, supplier not cleared), `held` was held, `approved` is inside its reversal window. */
export type ScheduleState = 'expected' | 'owed' | 'waiting' | 'held' | 'approved';

export interface OutflowItem {
  amount: number;
  /** `yyyy-mm-dd`, or null when the milestone cannot be dated yet (a retention whose installation is not scheduled). */
  date: string | null;
  state: ScheduleState;
}

/** How many weeks the cash-flow strip looks ahead. */
export const HORIZON_WEEKS = 8;
/** A week is concentrated when it carries at least this multiple of the average week over the horizon… */
export const CONCENTRATION_RATIO = 2;
/** …and at least this much money. A quiet horizon has no "heavy" week worth planning around. */
export const CONCENTRATION_FLOOR = 200_000;

export type GroupBy = 'week' | 'month';

/** The day a bucket starts: a Monday, or the first of a month. */
export function bucketStart(key: string, by: GroupBy): string {
  if (by === 'week') return startOfWeek(key);
  const d = parseKey(key);
  return dateKey(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function bucketEnd(start: string, by: GroupBy): string {
  if (by === 'week') return addDaysKey(start, 6);
  const d = parseKey(start);
  return dateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export interface Bucket<T extends OutflowItem> {
  start: string;
  end: string;
  items: T[];
  amount: number;
  /** Everything owed up to and including this bucket, so the commitment builds up the way cash-flow planning reads it. */
  running: number;
  /** A concentration of payments in this bucket (weeks only). */
  heavy: boolean;
}

/** Whether a payment already owed (a real payment whose date has come) rather than one still to come. */
export const isDueNow = (i: OutflowItem, today: string): boolean => i.state !== 'expected' && i.date !== null && i.date <= today;

/** Dated items grouped by week or month from today on, with running totals. Owed-now items sit apart, in `outflowTotals`,
 *  and lead the running total so it starts from what is already due. */
export function bucketize<T extends OutflowItem>(items: T[], by: GroupBy, now: number, span?: number): Bucket<T>[] {
  const today = todayKey(now);
  const dueNow = items.filter((i) => isDueNow(i, today));
  const ahead = items.filter((i) => i.date !== null && !isDueNow(i, today));
  const first = bucketStart(today, by);
  const count = span ?? (by === 'week' ? HORIZON_WEEKS : 6);
  const starts: string[] = [];
  let cursor = first;
  for (let n = 0; n < count; n += 1) {
    starts.push(cursor);
    cursor = by === 'week' ? addDaysKey(cursor, 7) : bucketStart(addDaysKey(bucketEnd(cursor, 'month'), 1), 'month');
  }
  let running = dueNow.reduce((n, i) => n + i.amount, 0);
  const buckets = starts.map((start): Bucket<T> => {
    const end = bucketEnd(start, by);
    const inside = ahead.filter((i) => i.date! >= start && i.date! <= end);
    const amount = inside.reduce((n, i) => n + i.amount, 0);
    running += amount;
    return { start, end, items: inside, amount, running, heavy: false };
  });
  if (by === 'week') markHeavy(buckets);
  return buckets;
}

/** Marks the weeks that carry a concentration, judged against the average week of the horizon. */
export function markHeavy<T extends OutflowItem>(buckets: Bucket<T>[]): void {
  const total = buckets.reduce((n, b) => n + b.amount, 0);
  const average = buckets.length ? total / buckets.length : 0;
  for (const b of buckets) b.heavy = b.amount >= CONCENTRATION_FLOOR && b.amount >= average * CONCENTRATION_RATIO;
}

export interface OutflowTotals {
  /** Fired and not yet paid: already owed, including anything held or waiting on an invoice. */
  owedNow: number;
  next7: number;
  next30: number;
  later: number;
  /** Real money whose date cannot be said yet. */
  undated: number;
  all: number;
}

/** Owed-now first; the rest by the day they are expected. `next7`/`next30` include what is owed now, since it goes out first. */
export function outflowTotals(items: OutflowItem[], now: number): OutflowTotals {
  const today = todayKey(now);
  const in7 = addDaysKey(today, 7);
  const in30 = addDaysKey(today, 30);
  const sum = (pick: (i: OutflowItem) => boolean) => items.filter(pick).reduce((n, i) => n + i.amount, 0);
  return {
    owedNow: sum((i) => isDueNow(i, today)),
    next7: sum((i) => i.date !== null && i.date <= in7),
    next30: sum((i) => i.date !== null && i.date <= in30),
    later: sum((i) => i.date !== null && i.date > in30),
    undated: sum((i) => i.date === null),
    all: sum(() => true),
  };
}

/** Days a milestone has slipped past where it was first expected; never negative. */
export function slipDays(plannedAt: string | null, expectedAt: string | null): number {
  if (!plannedAt || !expectedAt) return 0;
  const a = plannedAt.slice(0, 10);
  const b = expectedAt.slice(0, 10);
  return Math.max(0, Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86_400_000));
}
