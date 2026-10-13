/** Screen 085 — Loan/EMI Application Screen. Types, pure helpers and translation keys only. */

import type { LoanIncomeRange } from '@/data/types';

export type LoanEmiApplicationStatus = 'loading' | 'ready' | 'not_found' | 'error';

export const INCOME_RANGES: LoanIncomeRange[] = ['below_5l', '5l_10l', '10l_25l', 'above_25l'];

export const TENURE_OPTIONS = [12, 24, 36, 48, 60];

export interface LoanDraft {
  incomeRange: LoanIncomeRange | '';
  tenurePreferenceMonths: number | '';
  requestedAmount: number | '';
  tenureMonths: number | '';
  /** Locked in once the partner's rates are fetched successfully for the
   *  currently selected tenure — never silently recomputed after that
   *  without the customer changing tenure or amount again. */
  interestRatePercent: number | null;
  emiAmount: number | null;
  totalRepayment: number | null;
}

export const INITIAL_LOAN_DRAFT: LoanDraft = {
  incomeRange: '',
  tenurePreferenceMonths: '',
  requestedAmount: '',
  tenureMonths: '',
  interestRatePercent: null,
  emiAmount: null,
  totalRepayment: null,
};

/** Plain reducing-balance EMI — the same formula every real Indian lender
 *  publishes, so the number a customer sees here matches what they'd see
 *  quoted anywhere else. */
export function computeEmi(principal: number, annualRatePercent: number, tenureMonths: number): number {
  const r = annualRatePercent / 12 / 100;
  if (r === 0) return Math.round(principal / tenureMonths);
  const factor = Math.pow(1 + r, tenureMonths);
  return Math.round((principal * r * factor) / (factor - 1));
}

/** A simple, explainable precheck rule — a short tenure keeps the lender's
 *  risk low even at a low income, so only a *low income paired with a
 *  long tenure* fails the quick check. Never a hard block either way: the
 *  screen still lets the customer continue to a full application. */
export function evaluatePrecheck(incomeRange: LoanIncomeRange, tenurePreferenceMonths: number): { eligible: boolean; reasonKey?: string } {
  const eligible = !(incomeRange === 'below_5l' && tenurePreferenceMonths > 24);
  return eligible ? { eligible } : { eligible, reasonKey: LOAN_EMI_APPLICATION_KEYS.precheck.reason.lowIncomeLongTenure };
}

export const LOAN_EMI_APPLICATION_KEYS = {
  title: 'loanEmiApplication.title',
  subtitle: 'loanEmiApplication.subtitle',
  loading: 'loanEmiApplication.loading',
  notFound: { title: 'loanEmiApplication.notFound.title', body: 'loanEmiApplication.notFound.body' },
  error: { title: 'loanEmiApplication.error.title', body: 'loanEmiApplication.error.body' },

  step: {
    precheck: 'loanEmiApplication.step.precheck',
    details: 'loanEmiApplication.step.details',
    review: 'loanEmiApplication.step.review',
  },

  precheck: {
    heading: 'loanEmiApplication.precheck.heading',
    body: 'loanEmiApplication.precheck.body',
    incomeLabel: 'loanEmiApplication.precheck.incomeLabel',
    income: {
      below_5l: 'loanEmiApplication.precheck.income.below_5l',
      '5l_10l': 'loanEmiApplication.precheck.income.5l_10l',
      '10l_25l': 'loanEmiApplication.precheck.income.10l_25l',
      above_25l: 'loanEmiApplication.precheck.income.above_25l',
    },
    tenureLabel: 'loanEmiApplication.precheck.tenureLabel',
    resultEligible: 'loanEmiApplication.precheck.resultEligible',
    resultNotEligible: 'loanEmiApplication.precheck.resultNotEligible',
    reason: {
      lowIncomeLongTenure: 'loanEmiApplication.precheck.reason.lowIncomeLongTenure',
    },
  },

  details: {
    heading: 'loanEmiApplication.details.heading',
    remainingBalance: 'loanEmiApplication.details.remainingBalance',
    amountLabel: 'loanEmiApplication.details.amountLabel',
    amountHint: 'loanEmiApplication.details.amountHint',
    tenureLabel: 'loanEmiApplication.details.tenureLabel',
    ratesLoading: 'loanEmiApplication.details.ratesLoading',
    ratesUnavailable: { title: 'loanEmiApplication.details.ratesUnavailable.title', body: 'loanEmiApplication.details.ratesUnavailable.body' },
    partnerName: 'loanEmiApplication.details.partnerName',
    rate: 'loanEmiApplication.details.rate',
    emi: 'loanEmiApplication.details.emi',
    perMonth: 'loanEmiApplication.details.perMonth',
    totalRepayment: 'loanEmiApplication.details.totalRepayment',
    cashPrice: 'loanEmiApplication.details.cashPrice',
    interestCost: 'loanEmiApplication.details.interestCost',
  },

  review: {
    heading: 'loanEmiApplication.review.heading',
    incomeRange: 'loanEmiApplication.review.incomeRange',
    precheckResult: 'loanEmiApplication.review.precheckResult',
    amount: 'loanEmiApplication.review.amount',
    tenure: 'loanEmiApplication.review.tenure',
    rate: 'loanEmiApplication.review.rate',
    emi: 'loanEmiApplication.review.emi',
    totalRepayment: 'loanEmiApplication.review.totalRepayment',
    monthsSuffix: 'loanEmiApplication.review.monthsSuffix',
  },

  actionBar: {
    submit: 'loanEmiApplication.actionBar.submit',
  },

  tracker: {
    heading: 'loanEmiApplication.tracker.heading',
    status: {
      submitted: 'loanEmiApplication.tracker.status.submitted',
      under_review: 'loanEmiApplication.tracker.status.under_review',
      approved: 'loanEmiApplication.tracker.status.approved',
      disbursed: 'loanEmiApplication.tracker.status.disbursed',
      cancelled: 'loanEmiApplication.tracker.status.cancelled',
    },
    submittedBody: 'loanEmiApplication.tracker.submittedBody',
    underReviewBody: 'loanEmiApplication.tracker.underReviewBody',
    approvedFullBody: 'loanEmiApplication.tracker.approvedFullBody',
    approvedLessTitle: 'loanEmiApplication.tracker.approvedLessTitle',
    approvedLessBody: 'loanEmiApplication.tracker.approvedLessBody',
    disbursedBody: 'loanEmiApplication.tracker.disbursedBody',
    disbursedGapBody: 'loanEmiApplication.tracker.disbursedGapBody',
    cancelledBody: 'loanEmiApplication.tracker.cancelledBody',
    payGapAction: 'loanEmiApplication.tracker.payGapAction',
    requestedAmount: 'loanEmiApplication.tracker.requestedAmount',
    approvedAmount: 'loanEmiApplication.tracker.approvedAmount',
  },
} as const;
