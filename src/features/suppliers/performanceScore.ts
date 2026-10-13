import type { Supplier } from '@/data/types';

/**
 * The one composite supplier-performance formula in this build — screen
 * 026's Performance Scorecard and screen 091's directory both read it, so
 * a supplier's "performance score" is never two independently maintained
 * ratings. 026 lets Admin retune the weights interactively (its own local
 * UI state, not persisted); 091 always shows the default-weighted figure,
 * the standing score.
 */
export interface SupplierScoreWeights {
  onTime: number;
  quality: number;
  price: number;
  responsiveness: number;
}

export const DEFAULT_SUPPLIER_SCORE_WEIGHTS: SupplierScoreWeights = {
  onTime: 0.35,
  quality: 0.35,
  price: 0.15,
  responsiveness: 0.15,
};

/** Price and responsiveness aren't tracked in this build's data model yet —
 *  a neutral stand-in rather than an invented number; screens that show
 *  this score explain the placeholder. */
export const PLACEHOLDER_SCORE = 0.7;

export function computeSupplierPerformanceScore(supplier: Supplier, weights: SupplierScoreWeights = DEFAULT_SUPPLIER_SCORE_WEIGHTS): number {
  return supplier.onTimeRate * weights.onTime + (supplier.qualityScore / 5) * weights.quality + PLACEHOLDER_SCORE * weights.price + PLACEHOLDER_SCORE * weights.responsiveness;
}

export interface ScoreComponent {
  key: keyof SupplierScoreWeights;
  /** 0..1 — the factor's own value before weighting. */
  value: number;
  weight: number;
  /** value × weight — what it adds to the score. */
  contribution: number;
  /** Not tracked in this build yet; a neutral stand-in, said so plainly. */
  isPlaceholder: boolean;
}

/** The same formula as `computeSupplierPerformanceScore`, itemised — what
 *  097 shows a supplier so the score is never a black box. */
export function supplierScoreBreakdown(supplier: Supplier, weights: SupplierScoreWeights = DEFAULT_SUPPLIER_SCORE_WEIGHTS): ScoreComponent[] {
  const parts: [keyof SupplierScoreWeights, number, boolean][] = [
    ['onTime', supplier.onTimeRate, false],
    ['quality', supplier.qualityScore / 5, false],
    ['price', PLACEHOLDER_SCORE, true],
    ['responsiveness', PLACEHOLDER_SCORE, true],
  ];
  return parts.map(([key, value, isPlaceholder]) => ({ key, value, weight: weights[key], contribution: value * weights[key], isPlaceholder }));
}
