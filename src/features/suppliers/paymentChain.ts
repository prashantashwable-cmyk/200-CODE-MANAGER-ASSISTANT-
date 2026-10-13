import type { PurchaseOrderPaymentSnapshot, SupplierPaymentPart } from '@/data/types';
import { days } from '@/features/sla/clock';
import { checkSettings, paymentSchedule } from '@/features/suppliers/paymentTerms';
import type { SettingsIssue } from '@/features/suppliers/paymentTerms';

/**
 * Screen 112's milestone chain, pure. The chain is not a second definition of when a supplier is paid: each node
 * names a real event the app already records (the order sent, the supplier's confirmation, the signed delivery,
 * the retention released at handover), and the amounts come from 100's schedule. What this file adds is the
 * order those events should happen in, and a way to say when they did not.
 */

/** How long after the supplier is told, a confirmation is normally expected. */
export const ACK_EXPECTED_AFTER = days(1);
/** How long an installation typically runs from its start to its handover, for an expected retention date. */
export const HANDOVER_AFTER_START = days(14);

export type ChainNodeKind = 'po_issued' | 'acknowledged' | 'delivery_confirmed' | 'net_period' | 'retention_release' | 'final_release';

/** `event`: a real event fired it. `system`: the assistant did, on a timer. `manual`: Admin decided, with a reason. */
export type ChainSource = 'event' | 'system' | 'manual';

export type ChainNodeState = 'done' | 'current' | 'upcoming' | 'anomaly';

export interface ChainNodeFacts {
  sentAt?: string;
  acknowledgedAt?: string;
  /** Delivery received (103) and, where a confirmation exists, signed (104). */
  deliveredAt: string | null;
  /** Delivery has been received but not (yet) signed for. */
  receivedNotSigned: boolean;
  netDueAt: string | null;
  retention: { at: string; by: string | null } | null;
  /** When every part has been paid, if it has. */
  finishedAt: string | null;
  upfrontTrigger: 'on_send' | 'on_acknowledge' | null;
  isNet: boolean;
  hasRetention: boolean;
}

/** The nodes this order's terms actually pass through, in order. */
export function chainKinds(f: Pick<ChainNodeFacts, 'upfrontTrigger' | 'isNet' | 'hasRetention'>): ChainNodeKind[] {
  const out: ChainNodeKind[] = ['po_issued'];
  if (f.upfrontTrigger === 'on_acknowledge') out.push('acknowledged');
  out.push('delivery_confirmed');
  if (f.isNet) out.push('net_period');
  if (f.hasRetention) out.push('retention_release');
  out.push('final_release');
  return out;
}

export function firedAtOf(kind: ChainNodeKind, f: ChainNodeFacts): { at: string; source: ChainSource; by: string | null } | null {
  switch (kind) {
    case 'po_issued':
      return f.sentAt ? { at: f.sentAt, source: 'event', by: null } : null;
    case 'acknowledged':
      return f.acknowledgedAt ? { at: f.acknowledgedAt, source: 'event', by: null } : null;
    case 'delivery_confirmed':
      return f.deliveredAt ? { at: f.deliveredAt, source: 'event', by: null } : null;
    case 'net_period':
      return f.netDueAt && new Date(f.netDueAt).getTime() <= Date.now() ? { at: f.netDueAt, source: 'system', by: null } : null;
    case 'retention_release':
      // A retention Admin decided by hand is a person's judgement, not the handover working as designed.
      return f.retention ? { at: f.retention.at, source: f.retention.by ? 'manual' : 'system', by: f.retention.by } : null;
    case 'final_release':
      return f.finishedAt ? { at: f.finishedAt, source: 'system', by: null } : null;
  }
}

export type AnomalyKind = 'retention_before_delivery_confirmed' | 'delivery_before_send';

/** Events that fired out of order. These are put in front of Admin, never quietly processed. */
export function chainAnomalies(f: ChainNodeFacts): AnomalyKind[] {
  const out: AnomalyKind[] = [];
  if (f.retention && !f.deliveredAt) out.push('retention_before_delivery_confirmed');
  if (f.deliveredAt && f.sentAt && new Date(f.deliveredAt) < new Date(f.sentAt)) out.push('delivery_before_send');
  return out;
}

/* -------------------------------------------------------------------- split */

export interface SplitPart {
  part: SupplierPaymentPart;
  pct: number;
  amount: number;
}

export function splitOf(total: number, s: Pick<PurchaseOrderPaymentSnapshot, 'termType' | 'upfrontPct' | 'retentionPct'>): SplitPart[] {
  const parts = paymentSchedule(total, s, null);
  const pct = (kind: string) => (kind === 'upfront' ? (s.termType === 'net' ? 0 : s.upfrontPct) : kind === 'retention' ? s.retentionPct : 100 - (s.termType === 'net' ? 0 : s.upfrontPct) - s.retentionPct);
  return parts.map((p) => ({ part: p.kind as SupplierPaymentPart, pct: pct(p.kind), amount: p.amount }));
}

/** Words a deviation needs, so a one-off arrangement can be understood later. */
export const DEVIATION_REASON_MIN = 8;

export type SplitIssue = SettingsIssue | 'no_change' | 'reason_required';

/** Whether a one-off split is allowed: within the same limits as any tier, and actually different, and explained. */
export function checkDeviation(current: PurchaseOrderPaymentSnapshot, next: { upfrontPct: number; retentionPct: number }, reason: string): SplitIssue[] {
  const issues: SplitIssue[] = [...checkSettings({ termType: current.termType, upfrontPct: next.upfrontPct, retentionPct: next.retentionPct })];
  if (next.upfrontPct === current.upfrontPct && next.retentionPct === current.retentionPct) issues.push('no_change');
  if (reason.trim().length < DEVIATION_REASON_MIN) issues.push('reason_required');
  return issues;
}

/** Paying more up front, or holding back less, puts more of AIEC's money in the supplier's hands before the parts are proven. */
export const deviationIncreasesRisk = (before: { upfrontPct: number; retentionPct: number }, after: { upfrontPct: number; retentionPct: number }): boolean =>
  after.upfrontPct > before.upfrontPct || after.retentionPct < before.retentionPct;
