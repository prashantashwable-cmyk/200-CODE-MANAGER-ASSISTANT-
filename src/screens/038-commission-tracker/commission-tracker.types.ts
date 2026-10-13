/** Screen 038 — Commission & Incentive Tracker. Types and translation keys only. */

import type { CommissionEntry } from '@/data/types';

export type TrackerStatus = 'loading' | 'ready' | 'empty' | 'error';

export type PeriodId = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'allTime';

export const PERIODS: PeriodId[] = ['thisWeek', 'lastWeek', 'thisMonth', 'allTime'];

export interface PeriodTotals {
  current: number;
  previous: number;
  /** null when there is no prior-period baseline to compare against. */
  changePct: number | null;
}

/**
 * Every reason a commission entry can exist for. This screen owns these
 * translation keys — the seed ledger references them by this exact id, and
 * no other screen redefines them.
 */
export const REASON_IDS = ['leadConverted', 'leadQualified', 'siteVisitVerified', 'monthlyBonus'] as const;
export type ReasonId = (typeof REASON_IDS)[number];

export function reasonIdFromKey(reasonKey: string): ReasonId {
  const id = reasonKey.split('.').pop() as ReasonId;
  return REASON_IDS.includes(id) ? id : 'leadConverted';
}

export const COMMISSION_TRACKER_KEYS = {
  title: 'commissionTracker.title',
  subtitle: 'commissionTracker.subtitle',
  loading: 'commissionTracker.loading',
  period: {
    thisWeek: 'commissionTracker.period.thisWeek',
    lastWeek: 'commissionTracker.period.lastWeek',
    thisMonth: 'commissionTracker.period.thisMonth',
    allTime: 'commissionTracker.period.allTime',
  },
  total: 'commissionTracker.total',
  vsLastPeriod: 'commissionTracker.vsLastPeriod',
  status: {
    projected: 'commissionTracker.status.projected',
    approved: 'commissionTracker.status.approved',
    paid: 'commissionTracker.status.paid',
    forfeited: 'commissionTracker.status.forfeited',
  },
  statusExplain: {
    projected: 'commissionTracker.statusExplain.projected',
    approved: 'commissionTracker.statusExplain.approved',
    paid: 'commissionTracker.statusExplain.paid',
    forfeited: 'commissionTracker.statusExplain.forfeited',
  },
  rulesHeading: 'commissionTracker.rulesHeading',
  rule: {
    capture: 'commissionTracker.rule.capture',
    conversion: 'commissionTracker.rule.conversion',
    bonus: 'commissionTracker.rule.bonus',
  },
  nextPayout: 'commissionTracker.nextPayout',
  nextPayoutLabel: 'commissionTracker.nextPayoutLabel',
  ledgerHeading: 'commissionTracker.ledgerHeading',
  raiseQuery: 'commissionTracker.raiseQuery',
  queryNote: 'commissionTracker.queryNote',
  liveNote: 'commissionTracker.liveNote',
  empty: { title: 'commissionTracker.empty.title', body: 'commissionTracker.empty.body' },
  error: { title: 'commissionTracker.error.title', body: 'commissionTracker.error.body' },
} as const;
