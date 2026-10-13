import type {
  PurchaseOrderAgreementSnapshot,
  SupplierAgreementStatus,
  SupplierAgreementTerms,
  SupplierAgreementVersion,
  SupplierPurchaseOrder,
} from '@/data/types';
import { days } from '@/features/sla/clock';

/**
 * Screen 098's supplier agreement, pure. The agreement is the source of the
 * thresholds the rest of the supplier chain runs on — a PO's promised
 * delivery (and so 095's delay flag and 097's on-time rating) comes from its
 * `deliverySlaDays`, and when AIEC owes payment comes from its
 * `paymentTermsDays`. Nothing downstream keeps a copy of its own.
 */

/** Renewal is raised this far ahead of expiry — enough to renegotiate. */
export const RENEWAL_NOTICE = days(45);

export type AgreementStatus = SupplierAgreementStatus;

export const TERM_KEYS: (keyof SupplierAgreementTerms)[] = ['deliverySlaDays', 'paymentTermsDays', 'minQualityScore', 'warrantyMonths', 'qualityStandards'];

export const TERM_LIMITS = {
  deliverySlaDays: { min: 1, max: 180 },
  paymentTermsDays: { min: 0, max: 180 },
  minQualityScore: { min: 1, max: 5 },
  warrantyMonths: { min: 0, max: 120 },
} as const;

const ms = (iso: string) => new Date(iso).getTime();

export function versionsOf(all: SupplierAgreementVersion[], supplierId: string): SupplierAgreementVersion[] {
  return all.filter((v) => v.supplierId === supplierId).sort((a, b) => a.version - b.version);
}

/** The latest version whose effective date has arrived. */
export function versionInForce(versions: SupplierAgreementVersion[], now: number): SupplierAgreementVersion | null {
  let best: SupplierAgreementVersion | null = null;
  for (const v of versions) {
    if (ms(v.effectiveFrom) > now) continue;
    if (!best || ms(v.effectiveFrom) > ms(best.effectiveFrom) || (v.effectiveFrom === best.effectiveFrom && v.version > best.version)) best = v;
  }
  return best;
}

/** A recorded version that hasn't started yet — a signed renewal or a
 *  future-dated amendment. */
export function upcomingVersion(versions: SupplierAgreementVersion[], now: number): SupplierAgreementVersion | null {
  return versions.filter((v) => ms(v.effectiveFrom) > now).sort((a, b) => ms(a.effectiveFrom) - ms(b.effectiveFrom))[0] ?? null;
}

export interface AgreementState {
  status: AgreementStatus;
  current: SupplierAgreementVersion | null;
  upcoming: SupplierAgreementVersion | null;
  /** Days until the version in force expires (negative once lapsed). */
  daysToExpiry: number | null;
  /** A later version already carries the agreement past today's expiry. */
  renewalOnFile: boolean;
}

export function agreementState(versions: SupplierAgreementVersion[], now: number): AgreementState {
  const current = versionInForce(versions, now);
  const upcoming = upcomingVersion(versions, now);
  if (!current) return { status: 'none', current: null, upcoming, daysToExpiry: null, renewalOnFile: false };
  const expiry = ms(current.expiresOn);
  const daysToExpiry = Math.floor((expiry - now) / days(1));
  // Renewed means the next version starts no later than this one ends, and
  // runs past it — otherwise there's a gap in which nothing is in force.
  const renewalOnFile = !!upcoming && ms(upcoming.effectiveFrom) <= expiry + days(1) && ms(upcoming.expiresOn) > expiry;
  let status: AgreementStatus = 'active';
  if (expiry < now) status = 'lapsed';
  else if (!renewalOnFile && expiry - now <= RENEWAL_NOTICE) status = 'expiring';
  return { status, current, upcoming, daysToExpiry, renewalOnFile };
}

/** New POs need terms in force. An order already sent keeps its own
 *  snapshot and finishes under it whatever happens to the agreement. */
export function canIssueNewPo(status: AgreementStatus): boolean {
  return status === 'active' || status === 'expiring';
}

export function snapshotOf(version: SupplierAgreementVersion): PurchaseOrderAgreementSnapshot {
  return {
    agreementVersionId: version.id,
    version: version.version,
    deliverySlaDays: version.terms.deliverySlaDays,
    paymentTermsDays: version.terms.paymentTermsDays,
  };
}

/** Sent + the agreed SLA — the default promise for a PO nobody dated by hand. */
export function slaDeliveryDate(sentAt: string, snapshot: PurchaseOrderAgreementSnapshot): string {
  return new Date(ms(sentAt) + days(snapshot.deliverySlaDays)).toISOString();
}

/** The date this PO is held to: Admin's own date if set, else its SLA. */
export function promisedDeliveryOf(po: SupplierPurchaseOrder): string | null {
  if (po.expectedDeliveryDate) return po.expectedDeliveryDate;
  if (po.sentAt && po.agreementTerms) return slaDeliveryDate(po.sentAt, po.agreementTerms);
  return null;
}

/** When AIEC owes the supplier: delivery + the net days it was sent under. */
export function supplierPaymentDueDate(po: SupplierPurchaseOrder): string | null {
  if (!po.receivedAt || !po.agreementTerms) return null;
  return new Date(ms(po.receivedAt) + days(po.agreementTerms.paymentTermsDays)).toISOString();
}

/** Which terms a version changed against the one before it. */
export function changedTerms(previous: SupplierAgreementTerms | null, next: SupplierAgreementTerms): (keyof SupplierAgreementTerms)[] {
  if (!previous) return [];
  return TERM_KEYS.filter((k) => (typeof next[k] === 'string' ? String(next[k]).trim() !== String(previous[k]).trim() : next[k] !== previous[k]));
}

export type TermsIssue = 'sla_range' | 'payment_range' | 'quality_range' | 'warranty_range' | 'standards_required' | 'expiry_before_start';

export function checkTerms(terms: SupplierAgreementTerms, effectiveFrom: string, expiresOn: string): TermsIssue[] {
  const issues: TermsIssue[] = [];
  const within = (n: number, r: { min: number; max: number }, integer = true) => Number.isFinite(n) && n >= r.min && n <= r.max && (!integer || Number.isInteger(n));
  if (!within(terms.deliverySlaDays, TERM_LIMITS.deliverySlaDays)) issues.push('sla_range');
  if (!within(terms.paymentTermsDays, TERM_LIMITS.paymentTermsDays)) issues.push('payment_range');
  if (!within(terms.minQualityScore, TERM_LIMITS.minQualityScore, false)) issues.push('quality_range');
  if (!within(terms.warrantyMonths, TERM_LIMITS.warrantyMonths)) issues.push('warranty_range');
  if (!terms.qualityStandards.trim()) issues.push('standards_required');
  if (!effectiveFrom || !expiresOn || ms(expiresOn) <= ms(effectiveFrom)) issues.push('expiry_before_start');
  return issues;
}
