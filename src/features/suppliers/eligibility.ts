import type { Supplier } from '@/data/types';

/**
 * The one structural gate every Purchase Order flow reads (the deal-closure
 * kickoff's own supplier PO attempt, and screens 092/094 once built) —
 * a suspended or not-yet-KYC-approved supplier can never be eligible,
 * checked here once rather than re-derived ad hoc per call site. Screen
 * 091's own suspend action needs no separate "remove from eligible list"
 * step: the moment `status` moves to `'suspended'`, this immediately
 * returns false everywhere it's read.
 */
export function isSupplierEligibleForPO(supplier: Supplier): boolean {
  return supplier.status === 'active' && supplier.kycStatus === 'approved';
}
