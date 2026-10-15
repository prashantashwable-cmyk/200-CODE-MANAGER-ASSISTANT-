import type { Role } from '@/data/types';

/**
 * Privacy by geometry (master prompt P8.5, P8.6): the map is the biggest leak surface, so what a role may see is decided here
 * and enforced where data is read, never by hiding a pin on the screen.
 */

export interface LatLng { lat: number; lng: number }
export type RevealLevel = 'exact' | 'fuzzed' | 'density' | 'none';
export type SiteStage = 'lead' | 'offered' | 'accepted' | 'token_paid';
export type ContactLevel = 'full' | 'masked' | 'hidden';

export const DEFAULT_FUZZ_RADIUS_M = 500; // [ASSUMPTION] Owner-set
const M_PER_DEG_LAT = 111_320;

/** Great-circle distance in metres. */
export function distanceM(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** FNV-1a over a string, as an unsigned 32-bit number. */
function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (const ch of s) { h ^= ch.codePointAt(0) as number; h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/**
 * A pin moved by a repeatable offset: the same site always lands on the same fuzzed point (so panning and re-asking cannot be
 * averaged back to the truth), at 30–100% of the radius so it is never on top of the real place. `salt` is a server-only secret.
 */
export function fuzzPin(site: { id: string; lat: number; lng: number }, radiusM: number, salt: string): LatLng {
  const a = fnv(`${salt}|${site.id}|a`) / 0xffffffff;
  const d = fnv(`${salt}|${site.id}|d`) / 0xffffffff;
  const angle = a * 2 * Math.PI;
  const dist = radiusM * (0.3 + 0.7 * d);
  const dLat = (dist * Math.cos(angle)) / M_PER_DEG_LAT;
  const dLng = (dist * Math.sin(angle)) / (M_PER_DEG_LAT * Math.cos((site.lat * Math.PI) / 180));
  return { lat: site.lat + dLat, lng: site.lng + dLng };
}

/** Distance shown to a partner is to the FUZZED pin, rounded to 100 m: the true distance would let three readings find the site. */
export function shownDistanceM(from: LatLng, fuzzed: LatLng): number {
  return Math.max(100, Math.round(distanceM(from, fuzzed) / 100) * 100);
}

/**
 * Who sees a site's place, and how exactly.
 * Owner: exact. Admin: density only, never a single site's exact pin. Scout: exact for their own lead, nothing for others.
 * Customer: their own site exact. Partners (installer, supplier, logistics): fuzzed until they accept the offer or the token is paid.
 */
export function revealLevel(role: Role, stage: SiteStage, relation: { ownsLead?: boolean; isCustomerOfSite?: boolean }): RevealLevel {
  switch (role) {
    case 'owner': return 'exact';
    case 'admin': return 'density';
    case 'surveyor': return relation.ownsLead ? 'exact' : 'none';
    case 'customer': return relation.isCustomerOfSite ? 'exact' : 'none';
    case 'technician':
    case 'supplier': return stage === 'accepted' || stage === 'token_paid' ? 'exact' : stage === 'offered' ? 'fuzzed' : 'none';
  }
}

/** Contact numbers and names: full only after the same unlock; Admin always masked; a customer's partner never sees the customer's number before. */
export function contactLevel(role: Role, stage: SiteStage, relation: { ownsLead?: boolean; isCustomerOfSite?: boolean }): ContactLevel {
  if (role === 'owner') return 'full';
  if (role === 'admin') return 'masked';
  if (role === 'surveyor') return relation.ownsLead ? 'full' : 'hidden';
  if (role === 'customer') return relation.isCustomerOfSite ? 'full' : 'hidden';
  return stage === 'accepted' || stage === 'token_paid' ? 'full' : stage === 'offered' ? 'masked' : 'hidden';
}

/** Admin sees how many, not who or exactly where: counts per grid cell, cells with fewer than `minCount` suppressed. */
export function aggregateDensity(points: LatLng[], cellDeg = 0.01, minCount = 3): { lat: number; lng: number; count: number }[] {
  const cells = new Map<string, { lat: number; lng: number; count: number }>();
  for (const p of points) {
    const row = Math.floor(p.lat / cellDeg);
    const col = Math.floor(p.lng / cellDeg);
    const key = `${row}:${col}`;
    const cell = cells.get(key) ?? { lat: (row + 0.5) * cellDeg, lng: (col + 0.5) * cellDeg, count: 0 };
    cell.count += 1;
    cells.set(key, cell);
  }
  return [...cells.values()].filter((c) => c.count >= minCount);
}

/** A point is a signal for review, not proof of anything: poor accuracy is flagged, never rejected. */
export function gpsQuality(accuracyM: number | null | undefined, limitM: number): 'good' | 'poor' | 'unknown' {
  if (accuracyM == null || !Number.isFinite(accuracyM)) return 'unknown';
  return accuracyM <= limitM ? 'good' : 'poor';
}

/** Rate of distinct sites a partner has viewed across the city in a window: a scrape signal for the Owner, not an automatic block. */
export function scrapeSignal(viewedSiteIds: string[], windowMinutes: number, maxPerHour = 60): { suspicious: boolean; perHour: number } {
  const distinct = new Set(viewedSiteIds).size;
  const perHour = windowMinutes > 0 ? (distinct * 60) / windowMinutes : distinct;
  return { suspicious: perHour > maxPerHour, perHour: Math.round(perHour) };
}
