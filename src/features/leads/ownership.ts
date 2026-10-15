import { distanceM } from '@/features/geo/privacy';
import type { LatLng } from '@/features/geo/privacy';

/**
 * Lead ownership (master prompt P8.5): the first valid capture within an Owner-set radius and time window claims the lead;
 * later captures of the same place become supporting evidence, not rivals; an ambiguous case goes to the Decision Desk.
 * Pure: the repository asks, the screens only show the answer.
 */

export interface OwnershipSettings {
  /** Same place if closer than this plus the phones' own GPS error (urban multipath). */
  radiusM: number;
  /** A capture older than this no longer claims against a new one. */
  windowMs: number;
  /** Above this a point is "poor": a flag for review, never a rejection. */
  accuracyLimitM: number;
  /** Two captures this close in time cannot be ordered by phone clocks alone. */
  tooCloseMs: number;
  /** A capture cannot claim to be older than this when it arrives: an offline day is normal, a backdated week is not. */
  maxOfflineMs: number;
}

// [ASSUMPTION] all four are Owner settings; these are starting values.
export const DEFAULT_OWNERSHIP: OwnershipSettings = { radiusM: 60, windowMs: 30 * 86_400_000, accuracyLimitM: 30, tooCloseMs: 5 * 60_000, maxOfflineMs: 72 * 3_600_000 };

export interface Capture {
  leadId: string;
  scoutId: string;
  at: LatLng;
  /** The phone's clock reading when it was captured. */
  capturedAt: string;
  /** When the server received it. */
  receivedAt: string;
  /** The phone's clock error, measured at sync as (phone clock when sending) minus (server clock). Unknown = not measured. */
  clockSkewMs?: number;
  accuracyM: number | null;
  phone?: string;
}

/**
 * When a capture really happened, for ordering. The phone's time is corrected by its measured clock error, so a slow or fast phone
 * is put right and an honest offline capture sent hours later keeps its own time. It can never be later than the server received it,
 * nor older than `maxOfflineMs`: a phone cannot backdate a lead to take it from someone.
 */
export function orderingTime(c: Pick<Capture, 'capturedAt' | 'receivedAt' | 'clockSkewMs'>, maxOfflineMs = DEFAULT_OWNERSHIP.maxOfflineMs): number {
  const received = Date.parse(c.receivedAt);
  const corrected = Date.parse(c.capturedAt) - (c.clockSkewMs ?? 0);
  return Math.max(received - maxOfflineMs, Math.min(received, corrected));
}

export type OwnershipOutcome =
  | { outcome: 'claims' }
  | { outcome: 'supporting'; ownerLeadId: string }
  | { outcome: 'review'; ownerLeadId: string; reason: 'accuracy_conflict' | 'too_close_to_order' | 'earlier_capture_synced_late' };

const samePlace = (a: Capture, b: Capture, s: OwnershipSettings): boolean => {
  const margin = Math.min(a.accuracyM ?? 0, b.accuracyM ?? 0, 40);
  return distanceM(a.at, b.at) <= s.radiusM + margin;
};

/**
 * What a new capture does against what is already on record.
 * - nothing nearby in the window: it claims.
 * - an earlier valid capture of the same place: it is supporting evidence for that lead.
 * - it cannot be fairly ordered (clocks too close, or the earlier point was poor and the later one good): the Owner decides.
 */
export function decideOwnership(existing: Capture[], incoming: Capture, settings: OwnershipSettings = DEFAULT_OWNERSHIP): OwnershipOutcome {
  const inTime = orderingTime(incoming, settings.maxOfflineMs);
  const nearby = existing
    .filter((e) => e.leadId !== incoming.leadId && inTime - orderingTime(e, settings.maxOfflineMs) <= settings.windowMs && samePlace(e, incoming, settings))
    .sort((a, b) => orderingTime(a, settings.maxOfflineMs) - orderingTime(b, settings.maxOfflineMs));
  const first = nearby[0];
  if (!first) return { outcome: 'claims' };

  const gap = inTime - orderingTime(first, settings.maxOfflineMs);
  if (first.scoutId !== incoming.scoutId) {
    if (Math.abs(gap) <= settings.tooCloseMs) return { outcome: 'review', ownerLeadId: first.leadId, reason: 'too_close_to_order' };
    const firstPoor = first.accuracyM != null && first.accuracyM > settings.accuracyLimitM;
    const nowGood = incoming.accuracyM != null && incoming.accuracyM <= settings.accuracyLimitM;
    if (firstPoor && nowGood) return { outcome: 'review', ownerLeadId: first.leadId, reason: 'accuracy_conflict' };
  }
  // It says it was captured before the lead already on record. That may be an honest offline capture, or a backdated one: nothing here can tell, so a person decides.
  if (gap < 0) return first.scoutId === incoming.scoutId ? { outcome: 'claims' } : { outcome: 'review', ownerLeadId: first.leadId, reason: 'earlier_capture_synced_late' };
  return { outcome: 'supporting', ownerLeadId: first.leadId };
}
