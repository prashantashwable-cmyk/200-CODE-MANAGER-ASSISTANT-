import type {
  DeliveryRescheduleCause,
  DeliverySchedule,
  DeliveryWindow,
  SiteReadiness,
  SiteReadinessItem,
  SupplierDispatchAvailability,
} from '@/data/types';
import { days } from '@/features/sla/clock';

/**
 * Screen 101's delivery scheduling, pure. A delivery is booked for a day on
 * the site's calendar, in one of the supplier's real dispatch windows, and
 * only once the site can receive it. Everything the repository enforces and
 * the screen shows about a date comes from here, so the two can't disagree.
 */

export const DELIVERY_WINDOWS: DeliveryWindow[] = ['morning', 'afternoon'];
export const WINDOW_HOURS: Record<DeliveryWindow, { from: number; to: number }> = {
  morning: { from: 8, to: 12 },
  afternoon: { from: 12, to: 17 },
};

/** How far ahead a date can be picked. */
export const SLOT_HORIZON_DAYS = 60;

export const READINESS_ITEMS: SiteReadinessItem[] = ['shaft_civil', 'pit_depth', 'machine_room', 'power_supply', 'access_route', 'storage_space'];

/** Causes that are AIEC's or the site's, not the supplier's. Only these
 *  move the supplier's promised date. */
export const PROMISE_MOVING_CAUSES: DeliveryRescheduleCause[] = ['site', 'aiec'];

/* ------------------------------------------------------------------ dates */

const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDaysKey(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
export function todayKey(now: number): string {
  return dateKey(new Date(now));
}
/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(key: string): number {
  return parseKey(key).getDay();
}
/** When a booked window ends, as an instant — what "the delivery is due" means. */
export function windowEndsAt(key: string, window: DeliveryWindow): string {
  const d = parseKey(key);
  d.setHours(WINDOW_HOURS[window].to, 0, 0, 0);
  return d.toISOString();
}
/** Position on the timeline: two slots a day, so a later slot is a bigger number. */
export function slotOrder(key: string, window: DeliveryWindow): number {
  return Math.round(parseKey(key).getTime() / days(1)) * 2 + DELIVERY_WINDOWS.indexOf(window);
}

/* ------------------------------------------------------------------ slots */

export type SlotState = 'free' | 'past' | 'too_soon' | 'off_day' | 'window_not_offered' | 'blackout' | 'full' | 'no_availability';

/** Whether a supplier can deliver in this window on this day.
 *  `booked` is the supplier's other scheduled deliveries. */
export function slotState(
  availability: SupplierDispatchAvailability | null,
  booked: Pick<DeliverySchedule, 'date' | 'status'>[],
  key: string,
  window: DeliveryWindow,
  now: number,
): SlotState {
  if (!availability) return 'no_availability';
  const today = todayKey(now);
  if (key < today) return 'past';
  if (key < addDaysKey(today, availability.leadDays)) return 'too_soon';
  if (availability.blackouts.some((b) => b.date === key)) return 'blackout';
  if (!availability.weekdays.includes(weekdayOf(key))) return 'off_day';
  if (!availability.windows.includes(window)) return 'window_not_offered';
  const load = booked.filter((b) => b.status === 'scheduled' && b.date === key).length;
  if (load >= availability.maxPerDay) return 'full';
  return 'free';
}

export interface SlotDay {
  date: string;
  windows: { window: DeliveryWindow; state: SlotState }[];
}

export function slotDays(availability: SupplierDispatchAvailability | null, booked: Pick<DeliverySchedule, 'date' | 'status'>[], now: number): SlotDay[] {
  const start = todayKey(now);
  return Array.from({ length: SLOT_HORIZON_DAYS }, (_, i) => {
    const date = addDaysKey(start, i);
    return { date, windows: DELIVERY_WINDOWS.map((window) => ({ window, state: slotState(availability, booked, date, window, now) })) };
  });
}

/** The first few bookable slots — what "next available" chips offer. */
export function nextFreeSlots(days_: SlotDay[], count: number): { date: string; window: DeliveryWindow }[] {
  const out: { date: string; window: DeliveryWindow }[] = [];
  for (const day of days_) {
    for (const w of day.windows) {
      if (w.state === 'free') out.push({ date: day.date, window: w.window });
      if (out.length >= count) return out;
    }
  }
  return out;
}

/* -------------------------------------------------------------- readiness */

export function emptyReadiness(dealId: string): SiteReadiness {
  return {
    dealId,
    items: { shaft_civil: false, pit_depth: false, machine_room: false, power_supply: false, access_route: false, storage_space: false },
    isDemo: true,
  };
}

/** `site_readiness_confirmed_flag` — derived, so it can never disagree with
 *  the checklist. Every item ticked, someone on site having vouched for it,
 *  and — if a delivery once found the site not ready — that vouching made
 *  after the reset, not before it. */
export function readinessConfirmed(r: Pick<SiteReadiness, 'items' | 'confirmedAt' | 'resetAt'> | undefined | null): boolean {
  if (!r || !r.confirmedAt || !READINESS_ITEMS.every((k) => r.items[k])) return false;
  return !r.resetAt || r.confirmedAt > r.resetAt;
}

/* -------------------------------------------------------------- sequencing */

/** A dependent must land in a strictly later slot than what it depends on. */
export function sequenceOk(dependent: { date: string; window: DeliveryWindow }, prerequisite: { date: string; window: DeliveryWindow }): boolean {
  return slotOrder(dependent.date, dependent.window) > slotOrder(prerequisite.date, prerequisite.window);
}

/** Following `dependsOnPoId` from `poId` would come back to it. */
export function wouldCycle(schedules: Pick<DeliverySchedule, 'poId' | 'dependsOnPoId'>[], poId: string, dependsOn: string): boolean {
  const seen = new Set<string>();
  let cursor: string | undefined = dependsOn;
  while (cursor && !seen.has(cursor)) {
    if (cursor === poId) return true;
    seen.add(cursor);
    cursor = schedules.find((s) => s.poId === cursor)?.dependsOnPoId;
  }
  return false;
}

/** POs booked in a slot that isn't after what they depend on — e.g. the
 *  cabin was pushed back past the drive unit that was meant to follow it. */
export function sequenceConflicts(schedules: DeliverySchedule[]): Set<string> {
  const out = new Set<string>();
  for (const s of schedules) {
    if (s.status !== 'scheduled' || !s.date || !s.window || !s.dependsOnPoId) continue;
    const pre = schedules.find((p) => p.poId === s.dependsOnPoId);
    if (pre?.status === 'scheduled' && pre.date && pre.window && !sequenceOk({ date: s.date, window: s.window }, { date: pre.date, window: pre.window })) out.add(s.poId);
  }
  return out;
}

/** Whether a booked day is after the day the supplier was promised. */
export function laterThanPromise(key: string, promisedIso: string | null): boolean {
  return !!promisedIso && key > dateKey(new Date(promisedIso));
}

/** A date to a promise: the end of that day, so "on the promised day" is on time. */
export function endOfDayIso(key: string): string {
  const d = parseKey(key);
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}
