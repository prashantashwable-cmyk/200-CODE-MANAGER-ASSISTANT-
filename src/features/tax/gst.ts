/**
 * Screen 116's GST reconciliation, pure. Nothing here is filed or stored as a figure: input credit comes from the supplier
 * invoices that were actually matched (113), output GST from the customer invoices actually issued (087), each at the rate that
 * was recorded on that document, and the split between CGST + SGST and IGST is decided by the two GSTINs' state codes.
 */
import { days } from '@/features/sla/clock';

export type SupplyType = 'intra' | 'inter';
export interface TaxSplit {
  cgst: number;
  sgst: number;
  igst: number;
}

/** The state a GSTIN was registered in: its first two digits. */
export const stateCodeOf = (gstin: string | undefined | null): string | null => (gstin && /^\d{2}/.test(gstin) ? gstin.slice(0, 2) : null);

const GSTIN_FORMAT = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
/** `missing`: none on record, so no credit can be claimed. `format`: it cannot be a real GSTIN. */
export function gstinProblem(gstin: string | undefined | null): 'missing' | 'format' | null {
  if (!gstin || gstin.trim() === '') return 'missing';
  return GSTIN_FORMAT.test(gstin.trim().toUpperCase()) ? null : 'format';
}

/** Same state as AIEC is CGST + SGST, another state is IGST. A buyer with no GSTIN is supplied to in AIEC's own state. */
export function supplyType(partyGstin: string | undefined | null, aiecGstin: string): SupplyType {
  const party = stateCodeOf(partyGstin);
  return party === null || party === stateCodeOf(aiecGstin) ? 'intra' : 'inter';
}

/** Tax split for one amount. The two halves of a CGST + SGST supply always add back to the whole. */
export function splitTax(gst: number, supply: SupplyType): TaxSplit {
  if (supply === 'inter') return { cgst: 0, sgst: 0, igst: gst };
  const cgst = Math.floor(gst / 2);
  return { cgst, sgst: gst - cgst, igst: 0 };
}

export const addSplit = (a: TaxSplit, b: TaxSplit): TaxSplit => ({ cgst: a.cgst + b.cgst, sgst: a.sgst + b.sgst, igst: a.igst + b.igst });
export const ZERO_SPLIT: TaxSplit = { cgst: 0, sgst: 0, igst: 0 };

/* ---------------------------------------------------------------- periods */

/** `yyyy-mm` of a moment, in the local calendar. */
export function periodOf(iso: string | number | Date): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
export function shiftPeriod(period: string, by: number): string {
  const [y, m] = period.split('-').map(Number);
  return periodOf(new Date(y, m - 1 + by, 1));
}
/** The current period and the `count - 1` before it, newest first. */
export function recentPeriods(now: number, count: number): string[] {
  const current = periodOf(now);
  return Array.from({ length: count }, (_, i) => shiftPeriod(current, -i));
}
/** First day of the month after the period, as `yyyy-mm-dd`. */
export const periodEndsBefore = (period: string): string => `${shiftPeriod(period, 1)}-01`;
/** A period's own accountant hand-over is due on the 7th of the following month, well before returns are due on the 20th. */
export const HANDOVER_DUE_DAY = 7;
export function handoverDueAt(period: string): string {
  const [y, m] = shiftPeriod(period, 1).split('-').map(Number);
  return new Date(y, m - 1, HANDOVER_DUE_DAY, 10, 0, 0).toISOString();
}

/** A supplier's monthly return for month M falls due on the 20th of M + 1. The latest month that should be filed by now. */
export function latestDueReturn(now: number): string {
  const d = new Date(now);
  return shiftPeriod(periodOf(now), d.getDate() > 20 ? -1 : -2);
}

/* ------------------------------------------------------------ supplier risk */

export type SupplierStanding = 'active' | 'suspended' | 'cancelled';
/** How long a recorded check can be relied on before it is due again. */
export const CHECK_STALE_AFTER = days(30);

export type SupplierRiskKind = 'ok' | 'restricted' | 'filing_late' | 'unverified' | 'no_gstin' | 'invalid_gstin';

export interface SupplierRisk {
  kind: SupplierRiskKind;
  /** `yyyy-mm-dd` from which credit on this supplier's invoices is in doubt. Null means all of it. */
  since: string | null;
  /** The last check is older than `CHECK_STALE_AFTER`, or there is none. */
  stale: boolean;
}

export interface CheckFacts {
  standing: SupplierStanding;
  lastReturnPeriod: string | null;
  effectiveFrom?: string;
  checkedAt: string;
}

export function supplierRisk(gstin: string | undefined | null, check: CheckFacts | null, now: number): SupplierRisk {
  const problem = gstinProblem(gstin);
  if (problem === 'missing') return { kind: 'no_gstin', since: null, stale: false };
  if (problem === 'format') return { kind: 'invalid_gstin', since: null, stale: false };
  if (!check) return { kind: 'unverified', since: null, stale: true };
  const stale = now - new Date(check.checkedAt).getTime() > CHECK_STALE_AFTER;
  if (check.standing !== 'active') return { kind: 'restricted', since: check.effectiveFrom ?? check.checkedAt.slice(0, 10), stale };
  const due = latestDueReturn(now);
  if (check.lastReturnPeriod === null || check.lastReturnPeriod < due) {
    return { kind: 'filing_late', since: check.lastReturnPeriod === null ? null : periodEndsBefore(check.lastReturnPeriod), stale };
  }
  return { kind: 'ok', since: null, stale };
}

export type CreditStatus = 'claimable' | 'pending_match' | 'at_risk';
/** Whether the GST on one supplier invoice can be counted as input credit. An unmatched invoice is never claimed; a matched one
 *  is doubtful when its supplier is restricted or behind on returns and the invoice is dated from when that began. */
export function creditStatus(invoiceDate: string, matched: boolean, risk: SupplierRisk): CreditStatus {
  if (!matched) return 'pending_match';
  const doubtful = risk.kind === 'restricted' || risk.kind === 'filing_late' || risk.kind === 'no_gstin' || risk.kind === 'invalid_gstin';
  if (doubtful && (risk.since === null || invoiceDate >= risk.since)) return 'at_risk';
  return 'claimable';
}

/** Tax on a taxable value at a rate, rounded to the rupee like every other GST figure in the app. */
export const gstOn = (taxable: number, ratePct: number): number => Math.round(taxable * (ratePct / 100));
