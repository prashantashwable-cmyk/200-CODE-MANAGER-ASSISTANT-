import type {
  Job,
  PurchaseOrderPaymentSnapshot,
  Supplier,
  SupplierOrderRating,
  SupplierPaymentTermSettings,
  SupplierPaymentTermsConfig,
  SupplierRetention,
  SupplierTrustTier,
} from '@/data/types';
import { days } from '@/features/sla/clock';

/**
 * Screen 100's supplier payment terms, pure. The configuration root the
 * supplier-payment screens execute against: which share is paid when, and
 * how much is held back until the installation proves the parts sound.
 * Net days after delivery come from the supplier's agreement (098), never
 * a second value here.
 */

export const TRUST_TIERS: SupplierTrustTier[] = ['new', 'standard', 'trusted'];

export const DEFAULT_TIER_SETTINGS: Record<SupplierTrustTier, SupplierPaymentTermSettings> = {
  new: { termType: 'advance', upfrontPct: 30, retentionPct: 10 },
  standard: { termType: 'milestone', upfrontPct: 20, retentionPct: 5 },
  trusted: { termType: 'net', upfrontPct: 0, retentionPct: 5 },
};

/** A retention still held this long after delivery is put in front of Admin. */
export const RETENTION_REVIEW_AFTER = days(120);
/** How long Admin has to decide a retention paused by a supplier defect. */
export const RETENTION_DECISION_WINDOW = days(2);

/** Graduation is earned: a strong score over enough delivered orders. */
export const GRADUATION_MIN_SCORE = 0.8;
export const GRADUATION_MIN_ORDERS = 5;

export const LIMITS = { upfrontMax: 60, retentionMax: 20 } as const;

export function tierOf(supplier: Supplier): SupplierTrustTier {
  return supplier.paymentTier ?? 'new';
}

/** What a supplier is actually on: their override, or their tier's default. */
export function effectiveSettings(supplier: Supplier, config: SupplierPaymentTermsConfig): { settings: SupplierPaymentTermSettings; custom: boolean } {
  if (supplier.paymentTermsOverride) return { settings: supplier.paymentTermsOverride.settings, custom: true };
  return { settings: config.tiers[tierOf(supplier)], custom: false };
}

export function snapshotFor(supplier: Supplier, config: SupplierPaymentTermsConfig): PurchaseOrderPaymentSnapshot {
  const { settings, custom } = effectiveSettings(supplier, config);
  return { ...settings, tier: tierOf(supplier), custom };
}

export type SettingsIssue = 'upfront_range' | 'retention_range' | 'net_has_upfront' | 'upfront_required' | 'total_too_high';

export function checkSettings(s: SupplierPaymentTermSettings): SettingsIssue[] {
  const issues: SettingsIssue[] = [];
  const whole = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;
  if (!whole(s.upfrontPct, LIMITS.upfrontMax)) issues.push('upfront_range');
  if (!whole(s.retentionPct, LIMITS.retentionMax)) issues.push('retention_range');
  if (s.termType === 'net' && s.upfrontPct !== 0) issues.push('net_has_upfront');
  if (s.termType !== 'net' && s.upfrontPct === 0) issues.push('upfront_required');
  if (s.upfrontPct + s.retentionPct >= 100) issues.push('total_too_high');
  return issues;
}

/** Less money paid ahead of proof, or less held back, is AIEC taking on
 *  more risk — those changes get a confirmation step. */
export function increasesRisk(from: SupplierPaymentTermSettings, to: SupplierPaymentTermSettings): boolean {
  const upfrontBefore = from.termType === 'advance' ? from.upfrontPct : 0;
  const upfrontAfter = to.termType === 'advance' ? to.upfrontPct : 0;
  return to.retentionPct < from.retentionPct || upfrontAfter > upfrontBefore;
}

export interface SchedulePart {
  kind: 'upfront' | 'balance' | 'retention';
  /** When it falls due. */
  trigger: 'on_send' | 'on_acknowledge' | 'after_delivery' | 'on_handover';
  amount: number;
  netDays?: number;
}

/** How one order of `total` would be paid under these settings. */
export function paymentSchedule(total: number, s: SupplierPaymentTermSettings, netDays: number | null): SchedulePart[] {
  const upfront = s.termType === 'net' ? 0 : Math.round((total * s.upfrontPct) / 100);
  const retention = Math.round((total * s.retentionPct) / 100);
  const parts: SchedulePart[] = [];
  if (upfront > 0) parts.push({ kind: 'upfront', trigger: s.termType === 'advance' ? 'on_send' : 'on_acknowledge', amount: upfront });
  parts.push({ kind: 'balance', trigger: 'after_delivery', amount: total - upfront - retention, netDays: netDays ?? undefined });
  if (retention > 0) parts.push({ kind: 'retention', trigger: 'on_handover', amount: retention });
  return parts;
}

/** The next tier up, when the scorecard has earned it. */
export function graduationFor(tier: SupplierTrustTier, score: number, ratedOrders: number): SupplierTrustTier | null {
  if (ratedOrders < GRADUATION_MIN_ORDERS || score < GRADUATION_MIN_SCORE) return null;
  return tier === 'new' ? 'standard' : tier === 'standard' ? 'trusted' : null;
}

export type RetentionAction = { kind: 'release'; at: string } | { kind: 'pause' } | { kind: 'none' };

/**
 * What the heartbeat should do with a held retention. A supplier-attributed
 * defect on the order pauses it for Admin (the holdback exists for exactly
 * that); otherwise the first handover on the deal after the parts arrived
 * releases it. Until jobs are tied to specific POs (Module 11), the deal's
 * handover is the signal.
 */
export function retentionAction(retention: SupplierRetention, dealJobs: Job[], rating: SupplierOrderRating | undefined): RetentionAction {
  if (retention.status !== 'held') return { kind: 'none' };
  if (rating?.defects.some((d) => d.attribution === 'supplier')) return { kind: 'pause' };
  const handover = dealJobs
    .filter((j) => j.status === 'completed' && j.completedAt && j.completedAt >= retention.heldAt)
    .sort((a, b) => (a.completedAt! < b.completedAt! ? -1 : 1))[0];
  return handover ? { kind: 'release', at: handover.completedAt! } : { kind: 'none' };
}
