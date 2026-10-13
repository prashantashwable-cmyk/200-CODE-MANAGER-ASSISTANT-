import type { DeliveryPartner, PartnerTripRecord } from '@/data/types';
import { minutes } from '@/features/sla/clock';

/**
 * Screen 109's performance maths, pure. A partner is held to their *own* estimate at dispatch, never to
 * what the supplier promised the customer: a supplier that hands goods over late is not the carrier's
 * fault, and a carrier that drives slower than it said is not the supplier's. The one decomposition
 * below is what tells the two apart, and 105's root-cause tags and 097's supplier score can read it.
 */

/** Arriving within this long after their own estimate still counts as on time. */
export const ON_TIME_GRACE = minutes(60);
/** Deliveries needed before a rate is shown at all. Before that, honestly "not rated yet". */
export const MIN_RATED_TRIPS = 5;
/** Only the latest trips count, so a partner can recover from a bad patch. */
export const RATING_WINDOW = 20;
/** What a partner with no history ranks as, so a newcomer is neither blocked nor flattered. */
export const NEUTRAL_SCORE = 0.5;
/** A cause below this share of the total lateness is a side note, not a shared fault. */
const SHARED_SHARE = 0.25;

const ms = (iso: string) => new Date(iso).getTime();

/** What a trip needs to be judged: real legs and historic records both reduce to this. */
export interface TripFacts {
  id: string;
  partnerId: string;
  poCode: string;
  siteName: string;
  promisedAt: string;
  dispatchedAt: string;
  etaAt: string;
  arrivedAt: string;
  /** Where it came from: a past record, or a leg booked in the app. */
  origin: 'history' | 'leg';
  /** Set when 105 tagged the delay to an event outside anyone's control. */
  externalEvent?: boolean;
}

export const tripOfRecord = (r: PartnerTripRecord): TripFacts => ({
  id: r.id,
  partnerId: r.partnerId,
  poCode: r.poCode,
  siteName: r.siteName,
  promisedAt: r.promisedAt,
  dispatchedAt: r.dispatchedAt,
  etaAt: r.etaAt,
  arrivedAt: r.arrivedAt,
  origin: 'history',
  externalEvent: r.externalEvent,
});

export type Responsibility = 'partner' | 'supplier' | 'shared' | 'external';

export interface Lateness {
  /** Minutes after what the customer was promised (0 when on time). */
  lateMin: number;
  /** Late because the goods left too late for even a smooth trip to make the promise. */
  supplierMin: number;
  /** Late because the trip took longer than the partner had said. */
  partnerMin: number;
  responsibility: Responsibility | null;
}

/**
 * arrival − promise = (planned arrival − promise) + (actual arrival − planned arrival). The first term
 * is the supplier's (they handed over too late), the second the carrier's, so the split adds up exactly.
 */
export function latenessOf(t: TripFacts): Lateness {
  const toMin = (msDiff: number) => Math.max(0, Math.round(msDiff / 60_000));
  const graceMin = ON_TIME_GRACE / 60_000;
  const lateMin = toMin(ms(t.arrivedAt) - ms(t.promisedAt));
  const supplierRaw = toMin(ms(t.etaAt) - ms(t.promisedAt));
  const partnerRaw = toMin(ms(t.arrivedAt) - ms(t.etaAt));
  const partnerMin = partnerRaw > graceMin ? partnerRaw : 0;
  const supplierMin = supplierRaw > graceMin ? supplierRaw : 0;
  if (lateMin <= graceMin) return { lateMin: 0, supplierMin: 0, partnerMin: 0, responsibility: null };
  if (t.externalEvent) return { lateMin, supplierMin, partnerMin, responsibility: 'external' };
  const total = supplierMin + partnerMin;
  if (total === 0) return { lateMin, supplierMin, partnerMin, responsibility: 'supplier' };
  if (supplierMin === 0) return { lateMin, supplierMin, partnerMin, responsibility: 'partner' };
  if (partnerMin === 0) return { lateMin, supplierMin, partnerMin, responsibility: 'supplier' };
  const partnerShare = partnerMin / total;
  if (partnerShare < SHARED_SHARE) return { lateMin, supplierMin, partnerMin, responsibility: 'supplier' };
  if (partnerShare > 1 - SHARED_SHARE) return { lateMin, supplierMin, partnerMin, responsibility: 'partner' };
  return { lateMin, supplierMin, partnerMin, responsibility: 'shared' };
}

/** The carrier's own record: on time against their own estimate. */
export const carriedOnTime = (t: TripFacts) => ms(t.arrivedAt) - ms(t.etaAt) <= ON_TIME_GRACE;

export interface PartnerStats {
  trips: number;
  /** Null until there are enough trips to say. */
  onTimeRatePct: number | null;
  rated: boolean;
  /** How many more deliveries before a rate is shown. */
  tripsToRating: number;
  avgLateMin: number;
  lateCount: number;
  /** Late for the customer, and how it splits. */
  responsibility: Record<Responsibility, number>;
  /** 0..1 for ranking, neutral until rated. */
  score: number;
}

export function statsFor(trips: TripFacts[]): PartnerStats {
  // A delay nobody could help is not held against the carrier, so it is left out of their record altogether.
  const recent = [...trips]
    .filter((t) => !t.externalEvent)
    .sort((a, b) => (a.arrivedAt < b.arrivedAt ? 1 : -1))
    .slice(0, RATING_WINDOW);
  const late = recent.filter((t) => !carriedOnTime(t));
  const rated = recent.length >= MIN_RATED_TRIPS;
  const onTime = recent.length - late.length;
  const responsibility: Record<Responsibility, number> = { partner: 0, supplier: 0, shared: 0, external: 0 };
  for (const t of trips) {
    const r = latenessOf(t).responsibility;
    if (r) responsibility[r] += 1;
  }
  const lateMins = late.map((t) => Math.round((ms(t.arrivedAt) - ms(t.etaAt)) / 60_000));
  return {
    trips: trips.length,
    onTimeRatePct: rated ? Math.round((onTime / recent.length) * 100) : null,
    rated,
    tripsToRating: Math.max(0, MIN_RATED_TRIPS - recent.length),
    avgLateMin: lateMins.length ? Math.round(lateMins.reduce((a, b) => a + b, 0) / lateMins.length) : 0,
    lateCount: late.length,
    responsibility,
    score: rated ? onTime / recent.length : NEUTRAL_SCORE,
  };
}

/* ---------------------------------------------------------------- eligibility */

const norm = (city: string) => city.trim().toLowerCase();

export const serves = (partner: Pick<DeliveryPartner, 'serviceAreas'>, city: string) => partner.serviceAreas.some((a) => norm(a) === norm(city));

export type PartnerUnavailable = 'area' | 'paused';

/** Why a partner cannot be booked for this site, or null if they can. */
export function unavailableFor(partner: Pick<DeliveryPartner, 'serviceAreas' | 'status'>, siteCity: string): PartnerUnavailable | null {
  if (partner.status === 'paused') return 'paused';
  if (!serves(partner, siteCity)) return 'area';
  return null;
}

/** The lane priced for this trip, if the card has one. */
export function laneFor(partner: Pick<DeliveryPartner, 'lanes'>, originCity: string, destinationCity: string) {
  return partner.lanes.find((l) => norm(l.originCity) === norm(originCity) && norm(l.destinationCity) === norm(destinationCity)) ?? null;
}

export type TrackingMode = 'live' | 'manual' | 'fallback';

/** What Admin can expect for a new booking: a live pin, milestones only, or milestones because the feed is down. */
export function trackingModeOf(partner: Pick<DeliveryPartner, 'liveTrackingSupported' | 'feedStatus'>): TrackingMode {
  if (!partner.liveTrackingSupported) return 'manual';
  return partner.feedStatus === 'outage' ? 'fallback' : 'live';
}
