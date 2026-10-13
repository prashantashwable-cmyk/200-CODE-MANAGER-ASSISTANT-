/**
 * The partner agreement's rules, pure (146). Terms are numbers in a versioned template per role; the clause wording is a frozen namespace so a
 * signed document never changes. A standard offer is generated from the template in force; a different term for one person is an Admin-approved
 * addendum kept beside it, never an unreviewed edit. Signing activates the account for basic access; payouts wait for the remaining steps.
 */
import type { AgreementTerms, PartnerOffer } from '@/data/types';
import { INSTALL_POOL_PCT, LEAD_BONUS_SHARE, QC_FEE, SALES_CLOSE_PCT } from '@/features/commission/finalPayout';
import { days } from '@/features/sla/clock';
import type { RecruitRole } from './interest';

export const WORDING = 'v1' as const;
/** The surveyor's conversion share, as the commission ledger already pays it (1.5% of the deal when a lead converts). */
export const CONVERSION_PCT = 1.5;

export interface TermDef {
  key: keyof AgreementTerms;
  unit: 'pct' | 'inr' | 'days' | 'score' | 'months';
  min: number;
  max: number;
  /** Whether Admin may agree a different figure for one person. */
  negotiable: boolean;
}

export const TERM_DEFS: Record<RecruitRole, TermDef[]> = {
  surveyor: [
    { key: 'conversionPct', unit: 'pct', min: 0.5, max: 3, negotiable: true },
    { key: 'closePct', unit: 'pct', min: 0.25, max: 1, negotiable: true },
  ],
  technician: [
    { key: 'installPoolPct', unit: 'pct', min: 0.5, max: 2, negotiable: false },
    { key: 'leadBonusPct', unit: 'pct', min: 10, max: 40, negotiable: true },
    { key: 'qcFee', unit: 'inr', min: 500, max: 3000, negotiable: true },
  ],
  supplier: [
    { key: 'deliverySlaDays', unit: 'days', min: 3, max: 60, negotiable: true },
    { key: 'paymentTermsDays', unit: 'days', min: 7, max: 90, negotiable: true },
    { key: 'minQualityScore', unit: 'score', min: 2, max: 5, negotiable: true },
    { key: 'warrantyMonths', unit: 'months', min: 6, max: 60, negotiable: true },
  ],
};

/** The standard starting terms, from the same constants the commission ledger already uses (placeholders to tune from the template editor). */
export function defaultTermsOf(role: RecruitRole): AgreementTerms {
  if (role === 'surveyor') return { conversionPct: CONVERSION_PCT, closePct: SALES_CLOSE_PCT };
  if (role === 'technician') return { installPoolPct: INSTALL_POOL_PCT, leadBonusPct: Math.round(LEAD_BONUS_SHARE * 100), qcFee: QC_FEE };
  return { deliverySlaDays: 14, paymentTermsDays: 30, minQualityScore: 3.5, qualityStandards: 'IS 14665 and the National Building Code, as applicable to the part', warrantyMonths: 12 };
}

export interface Clause {
  id: string;
  /** Translation keys under `agreement.wording.<WORDING>.<role>.<id>`. */
  heading: string;
  body: string;
}
const CLAUSES: Record<RecruitRole, string[]> = {
  surveyor: ['parties', 'commission', 'payout', 'territory', 'conduct', 'independence', 'term'],
  technician: ['parties', 'commission', 'payout', 'insurance', 'safety', 'independence', 'term'],
  supplier: ['parties', 'commercial', 'warranty', 'quality', 'independence', 'term'],
};
export const clausesOf = (role: RecruitRole): Clause[] => CLAUSES[role].map((id) => ({ id, heading: `agreement.wording.${WORDING}.${role}.${id}.heading`, body: `agreement.wording.${WORDING}.${role}.${id}.body` }));

/** What still has to be finished after signing before payouts are released; they mirror each onboarding wizard's own payout gating. */
export const ACTIVATION_STEPS: Record<RecruitRole, string[]> = { surveyor: ['bank', 'photo'], technician: ['bank', 'photo'], supplier: ['bank'] };

export function capabilityOf(offer: Pick<PartnerOffer, 'activation'>): 'none' | 'basic' | 'full' {
  const a = offer.activation;
  if (!a) return 'none';
  return Object.values(a.steps).every((s) => s.done) ? 'full' : 'basic';
}

export const REQUEST_MIN = 15;
export const REASON_MIN = 20;
export const MAX_ADDENDUM_ITEMS = 3;
/** An offer left unsigned this long gets one gentle nudge and Admin a reminder (placeholder). */
export const SIGN_WAIT = days(3);
/** How soon after everything is in place Admin is asked to send the offer (placeholder). */
export const PREPARE_DUE = days(2);
/** Remaining onboarding steps left this long after signing are chased (placeholder). */
export const STEPS_DUE = days(7);

export type AddendumProblem = 'addendum_empty' | 'addendum_too_many' | 'addendum_term' | 'addendum_range' | 'addendum_same' | 'addendum_reason';
export function addendumProblem(role: RecruitRole, base: AgreementTerms, items: { key: keyof AgreementTerms; value: number }[], reason: string): AddendumProblem | null {
  if (items.length === 0) return 'addendum_empty';
  if (items.length > MAX_ADDENDUM_ITEMS) return 'addendum_too_many';
  const defs = TERM_DEFS[role];
  for (const it of items) {
    const d = defs.find((x) => x.key === it.key && x.negotiable);
    if (!d) return 'addendum_term';
    if (!Number.isFinite(it.value) || it.value < d.min || it.value > d.max) return 'addendum_range';
    if (base[it.key] === it.value) return 'addendum_same';
  }
  return reason.replace(/[^\p{L}\p{N}]/gu, '').length < REASON_MIN ? 'addendum_reason' : null;
}

/** The terms that actually bind: the standard ones with any approved addendum laid over them. */
export function bindingTermsOf(offer: Pick<PartnerOffer, 'terms' | 'addendum'>): AgreementTerms {
  const t: AgreementTerms = { ...offer.terms };
  for (const it of offer.addendum?.items ?? []) (t as Record<string, unknown>)[it.key] = it.value;
  return t;
}

export type SignProblem = 'consent_required' | 'identity_required' | 'signature_required' | 'name_required';
export function signProblem(i: { consent: boolean; otpVerified: boolean; method: 'drawn' | 'typed'; data: string; signerName: string }): SignProblem | null {
  if (!i.consent) return 'consent_required';
  if (!i.otpVerified) return 'identity_required';
  if (i.signerName.replace(/[^\p{L}\p{N}]/gu, '').length < 3) return 'name_required';
  return i.data.trim() ? null : 'signature_required';
}
