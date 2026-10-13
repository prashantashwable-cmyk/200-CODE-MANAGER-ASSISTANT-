/**
 * Booking a maintenance visit, pure (178). The same eligibility, workload and proximity ideas the installation and quality-check scheduling already use, applied to a service visit: only people with the
 * right skill who are free are offered, the nearest least-loaded one is named, and when nobody can be promised the customer is told the realistic timeline instead of a silent non-booking. **All numbers are placeholders
 * for the owner to confirm, flagged on screen.**
 */
import type { GeoPoint } from '@/data/types';
import { hours, minutes } from '@/features/sla/clock';
import { WINDOWS, addDays, busyBecause, dayKeyOf, isWorkingDay, windowPassed } from '@/features/qc/inspectors';
import type { BusyFacts } from '@/features/qc/inspectors';

export const OFFER_DAYS = 14;
/** How far ahead an honest "earliest we can do" is looked for. */
export const FAR_DAYS = 45;
export const MIN_NOTICE = hours(12);
/** A very rough road speed for an estimate of arrival (placeholder). */
export const AVG_KMH = 25;
/** A technician's position is only trusted for an arrival estimate when it is this fresh. */
export const FRESH_LOCATION = minutes(15);
export const ADHOC_NOTE_MIN = 15;
export const EXPIRING_DAYS = 60;
export const WINDOW_START_HOUR = { morning: 9, afternoon: 14 } as const;
export type Window = (typeof WINDOWS)[number];

export type AmcState = 'active' | 'expiring' | 'lapsed' | 'warranty' | 'none';
export interface AmcFacts { warrantyEndsOn: string | null; amc: { status: 'active' | 'later' | 'declined'; endsOn: string | null; tier: string | null; includedVisits: number; extraVisits: number; annualPrice: number | null; responseHours: number | null } | null }
export interface AmcView { state: AmcState; endsOn: string | null; tier: string | null; visitsTotal: number; responseHours: number | null; annualPrice: number | null }
const endOf = (d: string | null): number | null => (d ? Date.parse(d) + 86_400_000 - 1 : null);
/** Where the customer's cover stands, read from the registration: never guessed. */
export function amcStateOf(f: AmcFacts, now: number): AmcView {
  const a = f.amc;
  const base = { endsOn: a?.endsOn ?? null, tier: a?.tier ?? null, visitsTotal: a ? a.includedVisits + a.extraVisits : 0, responseHours: a?.responseHours ?? null, annualPrice: a?.annualPrice ?? null };
  if (a && a.status === 'active') {
    const end = endOf(a.endsOn);
    if (end === null || now > end) return { state: 'lapsed', ...base };
    return { state: end - now <= EXPIRING_DAYS * 86_400_000 ? 'expiring' : 'active', ...base };
  }
  const w = endOf(f.warrantyEndsOn);
  return { state: w !== null && now <= w ? 'warranty' : 'none', ...base, visitsTotal: 0 };
}
export const coversVisits = (s: AmcState): boolean => s === 'active' || s === 'expiring';
/** A visit is free only under a live plan with visits left; otherwise it is chargeable and the customer is told so before they confirm. */
export const chargeableOf = (s: AmcState, left: number): boolean => !(coversVisits(s) && left > 0);
/** An indicative price for one visit: the plan's yearly price over its included visits (placeholder), or nothing known. */
export const visitPriceOf = (annualPrice: number | null, visitsTotal: number): number | null => (annualPrice && visitsTotal > 0 ? Math.round(annualPrice / visitsTotal) : null);

export const haversineKm = (a: GeoPoint, b: GeoPoint): number => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};
export const etaMinutesOf = (km: number): number => Math.max(1, Math.round((km / AVG_KMH) * 60));

export interface Candidate { id: string; busy: BusyFacts; distanceKm: number; load: Record<string, number> }
export interface Slot { date: string; window: Window; free: string[]; best: string | null }
/** The free technician for one window: least loaded that day, then nearest, then by id so the answer is steady. */
export function bestFor(cands: Candidate[], date: string, window: Window): { free: string[]; best: string | null } {
  const free = cands.filter((c) => busyBecause(c.busy, date, window) === null);
  const ranked = [...free].sort((a, b) => (a.load[date] ?? 0) - (b.load[date] ?? 0) || a.distanceKm - b.distanceKm || a.id.localeCompare(b.id));
  return { free: free.map((c) => c.id), best: ranked[0]?.id ?? null };
}
/** Every window in the coming days, whether someone can be promised in it. */
export function slotsOf(input: { today: string; now: number; cands: Candidate[]; days: number }): Slot[] {
  const out: Slot[] = [];
  for (let i = 0; i <= input.days; i += 1) {
    const date = addDays(input.today, i);
    if (!isWorkingDay(date)) continue;
    for (const window of WINDOWS) {
      if (windowPassed(date, window, input.now)) continue;
      // Not inside the notice a visit needs.
      if (new Date(`${date}T00:00:00`).getTime() + WINDOW_START_HOUR[window] * 3_600_000 - input.now < MIN_NOTICE) continue;
      out.push({ date, window, ...bestFor(input.cands, date, window) });
    }
  }
  return out;
}

export type Honesty = 'ok' | 'skill_gap' | 'none_in_window' | 'none_soon';
/** What can honestly be said: slots in the next weeks, or the earliest there is, or that a person will have to confirm. */
export function honestyOf(cands: Candidate[], offered: Slot[], far: Slot[]): { honesty: Honesty; earliest: { date: string; window: Window } | null } {
  if (cands.length === 0) return { honesty: 'skill_gap', earliest: null };
  const first = offered.find((s) => s.best);
  if (first) return { honesty: 'ok', earliest: { date: first.date, window: first.window } };
  const later = far.find((s) => s.best);
  return later ? { honesty: 'none_in_window', earliest: { date: later.date, window: later.window } } : { honesty: 'none_soon', earliest: null };
}

export type BookingProblem = 'date_invalid' | 'date_past' | 'too_far' | 'not_working_day' | 'notice_short' | 'slot_taken' | 'lift_required' | 'not_handed_over' | 'note_required' | 'purpose_invalid';
export function bookingProblem(i: { date: string; window: Window; now: number; purpose: string; note: string; lettersInNote: number; farDays?: number }): BookingProblem | null {
  if (i.purpose !== 'routine' && i.purpose !== 'adhoc') return 'purpose_invalid';
  if (i.purpose === 'adhoc' && i.lettersInNote < ADHOC_NOTE_MIN) return 'note_required';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.date) || Number.isNaN(Date.parse(i.date))) return 'date_invalid';
  const today = dayKeyOf(i.now);
  if (i.date < today) return 'date_past';
  if (i.date > addDays(today, i.farDays ?? FAR_DAYS)) return 'too_far';
  if (!isWorkingDay(i.date)) return 'not_working_day';
  if (new Date(`${i.date}T00:00:00`).getTime() + WINDOW_START_HOUR[i.window] * 3_600_000 - i.now < MIN_NOTICE) return 'notice_short';
  return null;
}

export type Phase = 'not_today' | 'scheduled' | 'on_the_way' | 'arrived' | 'done' | 'missed' | 'cancelled';
/** Where a visit is on its own day, from what the technician has done. */
export function phaseOf(f: { ticketStatus: string; visit: { date: string; status: string; onTheWayAt?: string } | null; today: string }): Phase {
  if (f.ticketStatus === 'withdrawn') return 'cancelled';
  if (!f.visit) return 'not_today';
  if (f.visit.status === 'done') return 'done';
  if (f.visit.status === 'missed') return 'missed';
  if (f.visit.status === 'in_progress') return 'arrived';
  if (f.visit.date !== f.today) return 'not_today';
  return f.visit.onTheWayAt ? 'on_the_way' : 'scheduled';
}
