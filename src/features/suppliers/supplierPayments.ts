import type { PurchaseOrderPaymentSnapshot, SupplierPayment, SupplierPaymentPart, SupplierPaymentTrigger } from '@/data/types';
import { days, minutes } from '@/features/sla/clock';
import { paymentSchedule } from '@/features/suppliers/paymentTerms';

/**
 * Screen 111's supplier-payment rules, pure. A payment only exists once its configured milestone (100) has
 * genuinely fired, so Admin is never asked to approve what is not yet due. Everything that can reasonably make
 * Admin hesitate is computed here as a *flag* from the data, and approving through one takes a deliberate
 * acknowledgement. The screens for milestone release, invoice matching, schedule, history and disputes (112–120)
 * read these same definitions rather than inventing their own.
 */

/** After approving, this long to take it back before the transfer becomes irreversible. */
export const REVERSAL_WINDOW = minutes(10);
/** A payment above this is never "routine", however clean: it is looked at one by one. */
export const ROUTINE_LIMIT = 100_000;
/** How long Admin has to act on a payment that has fallen due. */
export const APPROVAL_DUE_AFTER = days(2);
/** A held payment comes back in front of Admin after this long. */
export const HOLD_REVIEW_AFTER = days(7);
/** A hold needs words, so it can be understood later. */
export const HOLD_REASON_MIN = 4;

export const PARTS: SupplierPaymentPart[] = ['upfront', 'balance', 'retention'];
export const TRIGGERS: SupplierPaymentTrigger[] = ['on_send', 'on_acknowledge', 'after_delivery', 'on_handover'];

export type HoldFlagKind = 'invoice_unmatched' | 'supplier_blocked' | 'open_report' | 'supplier_dispute' | 'orphaned' | 'rating_dispute' | 'high_value' | 'early_release';
/** `block`: cannot be approved at all. `hold`: a reason to hold, approvable only after acknowledging it.
 *  `care`: worth a look, no gate. */
export type FlagSeverity = 'block' | 'hold' | 'care';

export const FLAG_SEVERITY: Record<HoldFlagKind, FlagSeverity> = {
  invoice_unmatched: 'block',
  supplier_blocked: 'block',
  open_report: 'hold',
  supplier_dispute: 'hold',
  orphaned: 'hold',
  rating_dispute: 'care',
  high_value: 'care',
  early_release: 'care',
};

export const FLAG_ORDER: HoldFlagKind[] = ['invoice_unmatched', 'supplier_blocked', 'open_report', 'supplier_dispute', 'orphaned', 'rating_dispute', 'high_value', 'early_release'];

export interface PaymentFlag {
  kind: HoldFlagKind;
  severity: FlagSeverity;
  /** Why, where the kind has more than one reason (an invoice gate). */
  detail?: string;
}

export const flagOf = (kind: HoldFlagKind, detail?: string): PaymentFlag => ({ kind, severity: FLAG_SEVERITY[kind], ...(detail ? { detail } : {}) });

/** Routine means nothing here needs judging: small, and no flag at all. Only these may be approved in a batch. */
export const isRoutine = (flags: PaymentFlag[], amount: number): boolean => flags.length === 0 && amount <= ROUTINE_LIMIT;

export type ApprovalGate = 'ok' | 'blocked' | 'needs_acknowledgement';

/** Whether a payment may be approved, and what it needs first. */
export function approvalGate(flags: PaymentFlag[], acknowledged: boolean): ApprovalGate {
  if (flags.some((f) => f.severity === 'block')) return 'blocked';
  if (flags.some((f) => f.severity === 'hold') && !acknowledged) return 'needs_acknowledgement';
  return 'ok';
}

/* ------------------------------------------------------------- milestones */

export interface Milestone {
  part: SupplierPaymentPart;
  trigger: SupplierPaymentTrigger;
  amount: number;
  /** When the configured milestone fired. */
  firedAt: string;
  /** When it is owed. */
  dueAt: string;
}

export interface MilestoneFacts {
  total: number;
  paymentTerms: PurchaseOrderPaymentSnapshot;
  /** The supplier's agreed net days after delivery (098), or null. */
  netDays: number | null;
  sentAt?: string;
  acknowledgedAt?: string;
  /** Delivery received (103) and, where a confirmation exists, signed (104). Null until both. */
  deliveredAt: string | null;
  /** The retention (100) once it has been released at handover. */
  retentionReleased: { amount: number; at: string } | null;
  now: number;
}

const ms = (iso: string) => new Date(iso).getTime();
const iso = (n: number) => new Date(n).toISOString();

/** Only the parts whose milestone has genuinely fired by `now`. */
export function firedMilestones(f: MilestoneFacts): Milestone[] {
  const parts = paymentSchedule(f.total, f.paymentTerms, f.netDays);
  const out: Milestone[] = [];
  for (const part of parts) {
    if (part.kind === 'upfront') {
      const at = part.trigger === 'on_send' ? f.sentAt : f.acknowledgedAt;
      if (at && ms(at) <= f.now) out.push({ part: 'upfront', trigger: part.trigger, amount: part.amount, firedAt: at, dueAt: at });
    } else if (part.kind === 'balance') {
      if (!f.deliveredAt) continue;
      // A net supplier is owed after the net days; everyone else once the delivery is confirmed.
      const owedAt = f.paymentTerms.termType === 'net' && f.netDays !== null ? iso(ms(f.deliveredAt) + days(f.netDays)) : f.deliveredAt;
      if (ms(owedAt) <= f.now) out.push({ part: 'balance', trigger: 'after_delivery', amount: part.amount, firedAt: owedAt, dueAt: owedAt });
    } else if (f.retentionReleased && f.deliveredAt) {
      // A retention released before the delivery was confirmed is out of sequence: it is surfaced (112), never paid quietly.
      out.push({ part: 'retention', trigger: 'on_handover', amount: f.retentionReleased.amount, firedAt: f.retentionReleased.at, dueAt: f.retentionReleased.at });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ status */

export const reversalLeftMs = (p: Pick<SupplierPayment, 'status' | 'reversibleUntil'>, now: number): number =>
  p.status === 'approved' && p.reversibleUntil ? Math.max(0, ms(p.reversibleUntil) - now) : 0;

/** Days past the day it was owed, never negative. */
export const overdueDays = (p: Pick<SupplierPayment, 'dueAt'>, now: number): number => Math.max(0, Math.floor((now - ms(p.dueAt)) / 86_400_000));

/** A stand-in for the bank's own reference, until a real payment rail replaces it. */
export const bankReferenceFor = (code: string): string => `AIEC-TRF-${code.replace(/\D/g, '')}`;
