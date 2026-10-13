import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { SiteVisitVerification } from '@/data/types';
import {
  AUTO_APPROVE_SCORE,
  DEFAULT_RADIUS_METRES,
  LARGE_SITE_LEAD_IDS,
  LARGE_SITE_RADIUS_METRES,
  MISMATCH_SCORE,
  MIN_DWELL_MINUTES,
  MIN_PHOTOS,
} from './site-visit-verify.types';
import type {
  ConfidenceReason,
  GeoConfidence,
  QueueFilter,
  VerifyStatus,
  VisitRow,
} from './site-visit-verify.types';

interface SiteVisitVerifyState {
  status: VerifyStatus;
  rows: VisitRow[];
  filter: QueueFilter;
  setFilter: (filter: QueueFilter) => void;
  needsReviewCount: number;
  autoClearedCount: number;
  decide: (visit: SiteVisitVerification, next: 'verified' | 'flagged' | 'rejected') => Promise<void>;
  bulkApprove: () => Promise<void>;
  busy: boolean;
  reload: () => Promise<void>;
}

/**
 * The device's reported accuracy radius is not in the seeded record, so it is
 * derived from the drift itself in a way that mimics real behaviour: a fix
 * taken among high-rises reports a wide radius, an open-site fix a narrow one.
 * Replace this with the real `accuracy` field the moment location logging
 * carries it.
 */
function estimateAccuracy(visit: SiteVisitVerification): number {
  if (visit.gpsDriftMetres > 500) return 40;
  if (visit.gpsDriftMetres > 200) return 60;
  return 25;
}

function scoreVisit(visit: SiteVisitVerification): GeoConfidence {
  const accuracyMetres = estimateAccuracy(visit);
  const isLargeSite = LARGE_SITE_LEAD_IDS.includes(visit.leadId);
  const radius = isLargeSite ? LARGE_SITE_RADIUS_METRES : DEFAULT_RADIUS_METRES;

  // Drift expressed in units of the device's own uncertainty. Two sigma is
  // roughly the point where a fix stops being explainable by noise.
  const sigma = visit.gpsDriftMetres / accuracyMetres;

  const reasons: ConfidenceReason[] = [];
  let score = 1;

  if (visit.gpsDriftMetres > radius) {
    reasons.push('largeDrift');
    score -= Math.min(0.6, (visit.gpsDriftMetres - radius) / (radius * 4));
  }
  if (sigma > 2 && visit.gpsDriftMetres > radius) {
    score -= 0.15;
  } else if (sigma <= 2 && visit.gpsDriftMetres > radius) {
    // Within the device's own margin of error — the drift is explainable.
    reasons.push('poorAccuracy');
    score += 0.2;
  }
  if (isLargeSite && visit.gpsDriftMetres > DEFAULT_RADIUS_METRES) {
    reasons.push('largeSiteOverride');
  }
  if (visit.photoCount < MIN_PHOTOS) {
    reasons.push('tooFewPhotos');
    score -= 0.2;
  }
  if (!visit.photoTimestampsValid) {
    // EXIF stripped by a sharing app is common and not itself dishonest, so it
    // costs confidence rather than condemning the visit outright.
    reasons.push('timestampsInvalid');
    score -= 0.15;
  }
  if (visit.dwellMinutes < MIN_DWELL_MINUTES) {
    reasons.push('tooBrief');
    score -= 0.25;
  }

  const clamped = Math.max(0, Math.min(1, score));
  return {
    score: clamped,
    driftMetres: visit.gpsDriftMetres,
    accuracyMetres,
    sigma: Math.round(sigma * 10) / 10,
    verdict:
      clamped >= AUTO_APPROVE_SCORE ? 'clean' : clamped >= MISMATCH_SCORE ? 'borderline' : 'mismatch',
    reasons,
  };
}

/**
 * Owns the verification queue.
 *
 * The design goal is a small queue: anything scoring above the auto-approve bar
 * clears without a tap, so an admin only ever looks at genuinely borderline or
 * clearly wrong submissions.
 */
export function useSiteVisitVerify(): SiteVisitVerifyState {
  const repository = useData();
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [visits, setVisits] = useState<SiteVisitVerification[]>([]);
  const [filter, setFilter] = useState<QueueFilter>('needsReview');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const list = await repository.listSiteVisits();
      setVisits(list);
      setStatus(list.length === 0 ? 'empty' : 'ready');
    } catch {
      setStatus('error');
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const allRows = useMemo<VisitRow[]>(
    () =>
      visits.map((visit) => {
        const confidence = scoreVisit(visit);
        return {
          visit,
          confidence,
          autoCleared: confidence.verdict === 'clean',
        };
      }),
    [visits],
  );

  const rows = useMemo(() => {
    if (filter === 'all') return allRows;
    if (filter === 'autoCleared') return allRows.filter((r) => r.autoCleared);
    return allRows.filter((r) => !r.autoCleared && r.visit.status === 'pending');
  }, [allRows, filter]);

  const decide = useCallback(
    async (visit: SiteVisitVerification, next: 'verified' | 'flagged' | 'rejected') => {
      setBusy(true);
      try {
        // The reason travels with the decision, so the surveyor is told what
        // specifically was wrong rather than just being rejected.
        const reason = scoreVisit(visit).reasons[0];
        await repository.setSiteVisitStatus(visit.id, next, next === 'verified' ? undefined : reason);
        await reload();
      } finally {
        setBusy(false);
      }
    },
    [repository, reload],
  );

  const bulkApprove = useCallback(async () => {
    const clean = allRows.filter((r) => r.autoCleared && r.visit.status === 'pending');
    if (clean.length === 0) return;
    setBusy(true);
    try {
      await Promise.all(
        clean.map((row) => repository.setSiteVisitStatus(row.visit.id, 'verified')),
      );
      await reload();
    } finally {
      setBusy(false);
    }
  }, [allRows, repository, reload]);

  return {
    status: status === 'ready' && rows.length === 0 ? 'empty' : status,
    rows,
    filter,
    setFilter,
    needsReviewCount: allRows.filter((r) => !r.autoCleared && r.visit.status === 'pending').length,
    autoClearedCount: allRows.filter((r) => r.autoCleared).length,
    decide,
    bulkApprove,
    busy,
    reload,
  };
}
