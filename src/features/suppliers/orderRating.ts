import type { Supplier, SupplierOrderRating } from '@/data/types';
import { computeSupplierPerformanceScore } from './performanceScore';

/**
 * Screen 097's per-order rating, pure. Everything here feeds the one
 * supplier-score engine (`performanceScore.ts`) — an order's score is that
 * same formula applied to one order, and a supplier's on-time rate and
 * quality are these ratings aggregated. No second scoring system.
 */

/** Each defect genuinely down to the supplier costs this much of 5. */
const DEFECT_PENALTY = 1.5;

/** A supplier's standing reflects their recent orders, not their whole past. */
export const RATING_WINDOW = 20;

/** The scorecard's direction arrow compares against the score this many orders ago. */
export const SCORE_DELTA_ORDERS = 5;

export function isOnTime(rating: SupplierOrderRating): boolean {
  return rating.timelinessDays <= 0;
}

export function supplierDefectCount(rating: SupplierOrderRating): number {
  return rating.defects.filter((d) => d.attribution === 'supplier').length;
}

/** Objective defect score, blended evenly with Admin's own 1–5 when given. */
export function orderQuality(rating: SupplierOrderRating): number {
  const objective = Math.max(1, 5 - DEFECT_PENALTY * supplierDefectCount(rating));
  const blended = rating.adminQuality ? (objective + rating.adminQuality) / 2 : objective;
  return Math.round(blended * 10) / 10;
}

/** The supplier formula applied to this one order. */
export function orderScore(rating: SupplierOrderRating, supplier: Supplier): number {
  return computeSupplierPerformanceScore({ ...supplier, onTimeRate: isOnTime(rating) ? 1 : 0, qualityScore: orderQuality(rating) });
}

export function byDelivered(a: SupplierOrderRating, b: SupplierOrderRating): number {
  return a.deliveredAt < b.deliveredAt ? -1 : a.deliveredAt > b.deliveredAt ? 1 : 0;
}

/** On-time rate and average quality over the most recent window. */
export function aggregateRatings(ratings: SupplierOrderRating[]): { onTimeRate: number; qualityScore: number; rated: number } | null {
  const recent = [...ratings].sort(byDelivered).slice(-RATING_WINDOW);
  if (recent.length === 0) return null;
  const onTime = recent.filter(isOnTime).length;
  const quality = recent.reduce((sum, r) => sum + orderQuality(r), 0) / recent.length;
  return { onTimeRate: Math.round((onTime / recent.length) * 100) / 100, qualityScore: Math.round(quality * 10) / 10, rated: recent.length };
}
