/** Screen 017 — Site Visit Verification. Types and keys only. */

import type { SiteVisitVerification } from '@/data/types';

export type VerifyStatus = 'loading' | 'ready' | 'empty' | 'error';

export type QueueFilter = 'needsReview' | 'autoCleared' | 'all';

/**
 * Confidence that the photo was taken where the surveyor says it was.
 *
 * It is deliberately NOT raw distance. A 60 m gap in a high-rise canyon where
 * the device itself reported ±80 m accuracy is fine; the same gap from a clean
 * ±5 m fix is not. Weighting by the reported accuracy is what stops the queue
 * filling with false positives from dense urban sites.
 */
export interface GeoConfidence {
  /** 0..1 — higher is more trustworthy. */
  score: number;
  driftMetres: number;
  /** The device's own reported accuracy radius, in metres. */
  accuracyMetres: number;
  /** Drift measured in units of the device's own uncertainty. */
  sigma: number;
  verdict: 'clean' | 'borderline' | 'mismatch';
  reasons: ConfidenceReason[];
}

export type ConfidenceReason =
  | 'largeDrift'
  | 'poorAccuracy'
  | 'tooFewPhotos'
  | 'timestampsInvalid'
  | 'tooBrief'
  | 'largeSiteOverride';

export interface VisitRow {
  visit: SiteVisitVerification;
  confidence: GeoConfidence;
  /** True when the score cleared the bar without any admin action. */
  autoCleared: boolean;
}

/** Above this score a visit clears on its own — the queue stays small by design. */
export const AUTO_APPROVE_SCORE = 0.8;
export const MISMATCH_SCORE = 0.45;

/** Default trusted radius. Large sites can override it per lead. */
export const DEFAULT_RADIUS_METRES = 150;
export const LARGE_SITE_RADIUS_METRES = 600;

/** Sites genuinely spread over a wide area, e.g. a township under construction. */
export const LARGE_SITE_LEAD_IDS = ['l-15', 'l-6'];

export const MIN_PHOTOS = 3;
export const MIN_DWELL_MINUTES = 5;

export const VERIFY_KEYS = {
  title: 'siteVisitVerify.title',
  subtitle: 'siteVisitVerify.subtitle',
  loading: 'siteVisitVerify.loading',
  miniMapLabel: 'siteVisitVerify.miniMapLabel',
  filter: {
    needsReview: 'siteVisitVerify.filter.needsReview',
    autoCleared: 'siteVisitVerify.filter.autoCleared',
    all: 'siteVisitVerify.filter.all',
  },
  autoCleared: 'siteVisitVerify.autoCleared',
  autoClearedNote: 'siteVisitVerify.autoClearedNote',
  bulkApprove: 'siteVisitVerify.bulkApprove',
  bulkApproved: 'siteVisitVerify.bulkApproved',
  approve: 'siteVisitVerify.approve',
  flag: 'siteVisitVerify.flag',
  reject: 'siteVisitVerify.reject',
  confidence: 'siteVisitVerify.confidence',
  verdict: {
    clean: 'siteVisitVerify.verdict.clean',
    borderline: 'siteVisitVerify.verdict.borderline',
    mismatch: 'siteVisitVerify.verdict.mismatch',
  },
  reason: {
    largeDrift: 'siteVisitVerify.reason.largeDrift',
    poorAccuracy: 'siteVisitVerify.reason.poorAccuracy',
    tooFewPhotos: 'siteVisitVerify.reason.tooFewPhotos',
    timestampsInvalid: 'siteVisitVerify.reason.timestampsInvalid',
    tooBrief: 'siteVisitVerify.reason.tooBrief',
    largeSiteOverride: 'siteVisitVerify.reason.largeSiteOverride',
  },
  field: {
    drift: 'siteVisitVerify.field.drift',
    accuracy: 'siteVisitVerify.field.accuracy',
    photos: 'siteVisitVerify.field.photos',
    dwell: 'siteVisitVerify.field.dwell',
    surveyor: 'siteVisitVerify.field.surveyor',
    checkedIn: 'siteVisitVerify.field.checkedIn',
  },
  photoPlaceholder: 'siteVisitVerify.photoPlaceholder',
  exifNote: 'siteVisitVerify.exifNote',
  surveyorTold: 'siteVisitVerify.surveyorTold',
  empty: { title: 'siteVisitVerify.empty.title', body: 'siteVisitVerify.empty.body' },
  error: { title: 'siteVisitVerify.error.title', body: 'siteVisitVerify.error.body' },
} as const;
