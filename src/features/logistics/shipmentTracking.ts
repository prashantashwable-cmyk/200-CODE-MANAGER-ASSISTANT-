import type { ShipmentLeg, ShipmentMilestone, ShipmentMilestoneEvent } from '@/data/types';
import { haversineKm } from '@/design-system/format';
import { minutes } from '@/features/sla/clock';

/**
 * Screen 102's shipment tracking, pure. A live vehicle's position is a
 * function of the clock and the leg's own dispatch and arrival times — no
 * randomness — so what the map shows is always explainable, and a feed that
 * drops simply stops the clock at the moment it dropped.
 */

export interface Point {
  lat: number;
  lng: number;
}

export const MILESTONES: ShipmentMilestone[] = ['dispatched', 'in_transit', 'nearby', 'arrived'];
export const milestoneIndex = (m: ShipmentMilestone) => MILESTONES.indexOf(m);

/** Within this distance of the site, a vehicle is "nearby". */
export const NEARBY_KM = 5;
/** A vehicle counts as under way this long after it leaves. */
export const IN_TRANSIT_AFTER = minutes(10);
/** A road-going truck's average, halts included — used to estimate an ETA. */
export const AVERAGE_SPEED_KMPH = 35;
/** A lost feed becomes something Admin should look at after this long. */
export const FEED_LOST_ALERT_AFTER = minutes(30);
/** A manual leg owes an update this often until it arrives. */
export const MANUAL_UPDATE_EVERY = minutes(6 * 60);

const CITY_COORDS: Record<string, Point> = {
  mumbai: { lat: 19.076, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  thane: { lat: 19.2183, lng: 72.9781 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
};

/** Where a supplier's dispatch dock is, from its city. */
export function originFor(city: string | undefined): { name: string; lat: number; lng: number } {
  const key = (city ?? '').trim().toLowerCase();
  const point = CITY_COORDS[key] ?? CITY_COORDS.pune;
  return { name: city?.trim() || 'Pune', ...point };
}

/** A plain road-like path: out, a gentle bow, in. Never a ruler-straight line. */
export function routeFor(origin: Point, destination: Point): Point[] {
  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  // Bow the middle sideways by an eighth of the trip.
  const bowLat = (destination.lng - origin.lng) * 0.12;
  const bowLng = -(destination.lat - origin.lat) * 0.12;
  return [origin, { lat: midLat + bowLat, lng: midLng + bowLng }, destination];
}

export function routeKm(route: Point[]): number {
  let km = 0;
  for (let i = 1; i < route.length; i += 1) km += haversineKm(route[i - 1], route[i]);
  return km;
}

/** The point a fraction (0..1) of the way along the route. */
export function pointAtFraction(route: Point[], fraction: number): Point {
  const p = Math.min(1, Math.max(0, fraction));
  const total = routeKm(route);
  if (total === 0) return route[route.length - 1];
  let target = p * total;
  for (let i = 1; i < route.length; i += 1) {
    const seg = haversineKm(route[i - 1], route[i]);
    if (target <= seg || i === route.length - 1) {
      const t = seg === 0 ? 1 : Math.min(1, target / seg);
      return { lat: route[i - 1].lat + (route[i].lat - route[i - 1].lat) * t, lng: route[i - 1].lng + (route[i].lng - route[i - 1].lng) * t };
    }
    target -= seg;
  }
  return route[route.length - 1];
}

/** The part of the route already driven, ending at the vehicle. */
export function travelledRoute(route: Point[], fraction: number): Point[] {
  const here = pointAtFraction(route, fraction);
  const total = routeKm(route);
  const out: Point[] = [route[0]];
  let covered = 0;
  const target = Math.min(1, Math.max(0, fraction)) * total;
  for (let i = 1; i < route.length; i += 1) {
    const seg = haversineKm(route[i - 1], route[i]);
    if (covered + seg < target) out.push(route[i]);
    covered += seg;
  }
  out.push(here);
  return out;
}

/** An arrival estimate from distance alone — what a dispatch starts with. */
export function estimateEtaAt(origin: Point, destination: Point, dispatchedAtMs: number): string {
  const km = routeKm(routeFor(origin, destination));
  const hours = Math.max(1, km / AVERAGE_SPEED_KMPH);
  return new Date(dispatchedAtMs + hours * 3_600_000).toISOString();
}

const ms = (iso: string) => new Date(iso).getTime();

export type FeedState = 'live' | 'lost' | 'manual';

export interface LegSnapshot {
  feed: FeedState;
  /** 0..1 along the route. Meaningless for a manual leg. */
  progress: number;
  position: Point | null;
  /** When the position was last actually reported. */
  fixAt: string | null;
  remainingKm: number | null;
  /** To the planned ETA; negative once it has passed. */
  minutesToEta: number;
  milestone: ShipmentMilestone;
  arrived: boolean;
}

export interface TimelineEntry {
  milestone: ShipmentMilestone;
  reachedAt: string | null;
  source: 'gps' | 'manual' | null;
  byName?: string;
  note?: string;
  customerNotifiedAt?: string;
  customerNotifySkipped?: ShipmentMilestoneEvent['customerNotifySkipped'];
  /** Reached on the clock but not yet written down by the heartbeat. */
  persisted: boolean;
}

/** When each milestone falls for a live leg, from its own times. */
export function crossingTimes(leg: Pick<ShipmentLeg, 'dispatchedAt' | 'etaAt'>, route: Point[]): Record<ShipmentMilestone, number> {
  const start = ms(leg.dispatchedAt);
  const total = Math.max(1, ms(leg.etaAt) - start);
  const km = Math.max(0.001, routeKm(route));
  const nearFraction = Math.max(0, 1 - NEARBY_KM / km);
  const inTransit = start + Math.min(IN_TRANSIT_AFTER, total * 0.1);
  return {
    dispatched: start,
    in_transit: inTransit,
    // Never before it has left, however short the trip.
    nearby: Math.max(inTransit, start + nearFraction * total),
    arrived: start + total,
  };
}

function persistedOf(leg: ShipmentLeg, m: ShipmentMilestone): ShipmentMilestoneEvent | undefined {
  return leg.milestones.find((e) => e.milestone === m);
}

/** Every milestone, reached or not, with who said so and when. */
export function timelineOf(leg: ShipmentLeg, route: Point[], now: number): TimelineEntry[] {
  const crossings = crossingTimes(leg, route);
  // A dropped feed can't have seen anything after it dropped.
  const horizon = leg.source === 'live_gps' && leg.feedLostAt ? Math.min(now, ms(leg.feedLostAt)) : now;
  return MILESTONES.map((m): TimelineEntry => {
    const saved = persistedOf(leg, m);
    if (saved) {
      return { milestone: m, reachedAt: saved.at, source: saved.source, byName: saved.byName, note: saved.note, customerNotifiedAt: saved.customerNotifiedAt, customerNotifySkipped: saved.customerNotifySkipped, persisted: true };
    }
    if (leg.source === 'live_gps' && crossings[m] <= horizon) {
      return { milestone: m, reachedAt: new Date(crossings[m]).toISOString(), source: 'gps', persisted: false };
    }
    return { milestone: m, reachedAt: null, source: null, persisted: false };
  });
}

export function legSnapshotOf(leg: ShipmentLeg, route: Point[], now: number): LegSnapshot {
  const timeline = timelineOf(leg, route, now);
  const reached = timeline.filter((e) => e.reachedAt);
  const milestone = reached.length ? reached[reached.length - 1].milestone : 'dispatched';
  const arrived = milestone === 'arrived';
  const minutesToEta = Math.round((ms(leg.etaAt) - now) / 60_000);
  if (leg.source === 'manual') {
    return { feed: 'manual', progress: arrived ? 1 : 0, position: null, fixAt: null, remainingKm: null, minutesToEta, milestone, arrived };
  }
  const lost = !!leg.feedLostAt && now >= ms(leg.feedLostAt);
  const fixMs = lost ? ms(leg.feedLostAt!) : now;
  const total = Math.max(1, ms(leg.etaAt) - ms(leg.dispatchedAt));
  const progress = arrived && !lost ? 1 : Math.min(1, Math.max(0, (fixMs - ms(leg.dispatchedAt)) / total));
  return {
    feed: lost ? 'lost' : 'live',
    progress,
    position: pointAtFraction(route, progress),
    fixAt: new Date(fixMs).toISOString(),
    remainingKm: Math.max(0, routeKm(route) * (1 - progress)),
    minutesToEta,
    milestone,
    arrived,
  };
}

/** Whole minutes → "1 h 24 min" / "12 min", from a positive count. */
export function splitMinutes(total: number): { hours: number; minutes: number } {
  const m = Math.max(0, Math.round(total));
  return { hours: Math.floor(m / 60), minutes: m % 60 };
}

/** A customer-friendly time: the nearest quarter hour, so "around 2:30", not "2:27". */
export function roundToQuarter(iso: string): Date {
  const d = new Date(iso);
  const q = 15 * 60_000;
  return new Date(Math.round(d.getTime() / q) * q);
}

/** Whether an arrival falls inside the delivery window that was booked (101). */
export function etaInsideWindow(etaIso: string, window: { from: number; to: number }): boolean {
  const d = new Date(etaIso);
  const hour = d.getHours() + d.getMinutes() / 60;
  return hour >= window.from && hour <= window.to;
}
