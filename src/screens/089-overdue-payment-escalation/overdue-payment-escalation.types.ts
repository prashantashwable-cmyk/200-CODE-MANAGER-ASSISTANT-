/** Screen 089 — Overdue Payment Escalation Screen. Types and translation keys only. */

import type { CallOutcome } from '@/data/types';
import type { EscalationTier } from '@/data/repository';

export type OverduePaymentEscalationStatus = 'loading' | 'ready' | 'error';

export const TIER_FILTERS: EscalationTier[] = ['call', 'formal_notice', 'installation_hold'];

/** This screen's own local copy of the call-disposition options — 054 owns
 *  `callLog.outcome.*` under its own namespace, not a shared one, and
 *  screens never import from another screen's folder, so the same five
 *  values are re-declared here rather than reused. */
export const CALL_OUTCOME_OPTIONS: CallOutcome[] = ['connected_interested', 'connected_not_interested', 'no_answer', 'wrong_number', 'pocket_dial'];

export const OVERDUE_PAYMENT_ESCALATION_KEYS = {
  title: 'overduePaymentEscalation.title',
  subtitle: 'overduePaymentEscalation.subtitle',
  loading: 'overduePaymentEscalation.loading',
  error: { title: 'overduePaymentEscalation.error.title', body: 'overduePaymentEscalation.error.body' },
  empty: { title: 'overduePaymentEscalation.empty.title', body: 'overduePaymentEscalation.empty.body' },
  noResults: { title: 'overduePaymentEscalation.noResults.title', body: 'overduePaymentEscalation.noResults.body' },

  filters: {
    all: 'overduePaymentEscalation.filters.all',
  },

  tier: {
    call: 'overduePaymentEscalation.tier.call',
    formal_notice: 'overduePaymentEscalation.tier.formal_notice',
    installation_hold: 'overduePaymentEscalation.tier.installation_hold',
  },

  row: {
    overdueDays: 'overduePaymentEscalation.row.overdueDays',
    goodStanding: 'overduePaymentEscalation.row.goodStanding',
    safetyWarning: 'overduePaymentEscalation.row.safetyWarning',
  },

  detail: {
    overdueAmountLabel: 'overduePaymentEscalation.detail.overdueAmountLabel',
    overdueDaysLabel: 'overduePaymentEscalation.detail.overdueDaysLabel',
    tierLabel: 'overduePaymentEscalation.detail.tierLabel',
    goodStandingNote: 'overduePaymentEscalation.detail.goodStandingNote',
    activeJobsLabel: 'overduePaymentEscalation.detail.activeJobsLabel',
    noActiveJobs: 'overduePaymentEscalation.detail.noActiveJobs',
    logCall: 'overduePaymentEscalation.detail.logCall',
    sendNotice: 'overduePaymentEscalation.detail.sendNotice',
    flagHold: 'overduePaymentEscalation.detail.flagHold',
    viewHistory: 'overduePaymentEscalation.detail.viewHistory',
  },

  callSheet: {
    title: 'overduePaymentEscalation.callSheet.title',
    outcomeLabel: 'overduePaymentEscalation.callSheet.outcomeLabel',
    durationLabel: 'overduePaymentEscalation.callSheet.durationLabel',
    consentLabel: 'overduePaymentEscalation.callSheet.consentLabel',
    submit: 'overduePaymentEscalation.callSheet.submit',
  },

  holdSheet: {
    title: 'overduePaymentEscalation.holdSheet.title',
    hint: 'overduePaymentEscalation.holdSheet.hint',
    elevatedWarning: 'overduePaymentEscalation.holdSheet.elevatedWarning',
    reasonLabel: 'overduePaymentEscalation.holdSheet.reasonLabel',
    acknowledgeLabel: 'overduePaymentEscalation.holdSheet.acknowledgeLabel',
    submit: 'overduePaymentEscalation.holdSheet.submit',
  },

  outcome: {
    connected_interested: 'overduePaymentEscalation.outcome.connected_interested',
    connected_not_interested: 'overduePaymentEscalation.outcome.connected_not_interested',
    no_answer: 'overduePaymentEscalation.outcome.no_answer',
    wrong_number: 'overduePaymentEscalation.outcome.wrong_number',
    pocket_dial: 'overduePaymentEscalation.outcome.pocket_dial',
  },

  toast: {
    callLogged: 'overduePaymentEscalation.toast.callLogged',
    noticeSent: 'overduePaymentEscalation.toast.noticeSent',
    holdFlagged: 'overduePaymentEscalation.toast.holdFlagged',
    error: 'overduePaymentEscalation.toast.error',
  },
} as const;
