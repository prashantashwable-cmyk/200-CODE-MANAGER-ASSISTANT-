/** Screen 026 — Supplier Performance Scorecard. Types and keys only. */

import type { Supplier } from '@/data/types';
import { DEFAULT_SUPPLIER_SCORE_WEIGHTS } from '@/features/suppliers/performanceScore';
import type { SupplierScoreWeights } from '@/features/suppliers/performanceScore';

export type ScoreStatus = 'loading' | 'ready' | 'empty' | 'error';

/** The four inputs to the composite score, each admin-weightable — the
 *  same shape `@/features/suppliers/performanceScore` (091's own read)
 *  uses, aliased here for this screen's own naming. */
export type ScoreWeights = SupplierScoreWeights;

export const DEFAULT_WEIGHTS: ScoreWeights = DEFAULT_SUPPLIER_SCORE_WEIGHTS;

export const WATCHLIST_THRESHOLD = 0.65;
/** A brand-new supplier's score is a snapshot, not yet a track record. */
export const EARLY_DATA_ORDER_COUNT = 3;

export const WEIGHT_KEYS: (keyof ScoreWeights)[] = ['onTime', 'quality', 'price', 'responsiveness'];

export interface SupplierScoreRow {
  supplier: Supplier;
  /** Derived from onTimeRate/qualityScore in the seed model — price and
   *  responsiveness are not tracked yet, so they use a neutral placeholder
   *  value rather than an invented number, and the UI says so. */
  priceScore: number;
  responsivenessScore: number;
  overallScore: number;
  isEarlyData: boolean;
  onWatchlist: boolean;
  monthsBelowThreshold: number;
}

export const SUPPLIER_SCORE_KEYS = {
  title: 'supplierScore.title',
  subtitle: 'supplierScore.subtitle',
  loading: 'supplierScore.loading',
  weightsHeading: 'supplierScore.weightsHeading',
  weight: {
    onTime: 'supplierScore.weight.onTime',
    quality: 'supplierScore.weight.quality',
    price: 'supplierScore.weight.price',
    responsiveness: 'supplierScore.weight.responsiveness',
  },
  metric: {
    onTime: 'supplierScore.metric.onTime',
    quality: 'supplierScore.metric.quality',
    price: 'supplierScore.metric.price',
    responsiveness: 'supplierScore.metric.responsiveness',
  },
  placeholderNote: 'supplierScore.placeholderNote',
  overallScore: 'supplierScore.overallScore',
  earlyData: 'supplierScore.earlyData',
  earlyDataNote: 'supplierScore.earlyDataNote',
  watchlist: 'supplierScore.watchlist',
  watchlistAdd: 'supplierScore.watchlistAdd',
  watchlistRemove: 'supplierScore.watchlistRemove',
  watchlistAuto: 'supplierScore.watchlistAuto',
  incidentNote: 'supplierScore.incidentNote',
  openOrders: 'supplierScore.openOrders',
  totalValue: 'supplierScore.totalValue',
  viewOrders: 'supplierScore.viewOrders',
  disputeNote: 'supplierScore.disputeNote',
  pendingHeading: 'supplierScore.pendingHeading',
  empty: { title: 'supplierScore.empty.title', body: 'supplierScore.empty.body' },
  error: { title: 'supplierScore.error.title', body: 'supplierScore.error.body' },
} as const;
