/** Screen 035 — Duplicate Lead Detection & Warning. Types and keys only. */

import type { Lead } from '@/data/types';

export type DuplicateCheckStatus = 'checking' | 'clear' | 'flagged' | 'error';

export type MatchReason = 'proximity' | 'phone' | 'name';

export interface DuplicateMatch {
  lead: Lead;
  distanceMetres: number;
  reason: MatchReason;
  /** True when the matched lead belongs to this same surveyor — a different,
   *  friendlier situation than flagging a stranger's site as a duplicate. */
  isOwnLead: boolean;
  surveyorName: string;
}

/**
 * The radius a proximity match is judged against. The spec calls for this to
 * be admin-configurable per territory (tight for dense high-rises, wider for
 * sprawling suburban plots) — that per-territory override is not modelled in
 * this build's data yet, so every check uses one baseline radius. The concept
 * is real; the per-territory tuning is future work, said plainly in the UI.
 */
export const BASELINE_RADIUS_METRES = 150;

export const CAPTURE_DUPLICATE_KEYS = {
  title: 'captureDuplicate.title',
  subtitle: 'captureDuplicate.subtitle',
  checking: 'captureDuplicate.checking',
  clear: { title: 'captureDuplicate.clear.title', body: 'captureDuplicate.clear.body' },
  radiusExplainer: 'captureDuplicate.radiusExplainer',
  reason: {
    proximity: 'captureDuplicate.reason.proximity',
    phone: 'captureDuplicate.reason.phone',
    name: 'captureDuplicate.reason.name',
  },
  compare: {
    heading: 'captureDuplicate.compare.heading',
    existing: 'captureDuplicate.compare.existing',
    new: 'captureDuplicate.compare.new',
    capturedBy: 'captureDuplicate.compare.capturedBy',
    capturedOn: 'captureDuplicate.compare.capturedOn',
    distance: 'captureDuplicate.compare.distance',
  },
  ownLead: {
    banner: 'captureDuplicate.ownLead.banner',
    updateAction: 'captureDuplicate.ownLead.updateAction',
  },
  decision: {
    isDuplicate: 'captureDuplicate.decision.isDuplicate',
    isDifferent: 'captureDuplicate.decision.isDifferent',
    isDifferentHint: 'captureDuplicate.decision.isDifferentHint',
  },
  confirmCancel: {
    title: 'captureDuplicate.confirmCancel.title',
    body: 'captureDuplicate.confirmCancel.body',
    confirm: 'captureDuplicate.confirmCancel.confirm',
    back: 'captureDuplicate.confirmCancel.back',
  },
  flaggedNote: 'captureDuplicate.flaggedNote',
  error: { title: 'captureDuplicate.error.title', body: 'captureDuplicate.error.body' },
} as const;
