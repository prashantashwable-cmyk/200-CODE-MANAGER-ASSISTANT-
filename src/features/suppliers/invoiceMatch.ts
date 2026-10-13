/**
 * Screen 113's three-way match, pure: the order's own recorded price and quantity, the supplier's invoice, and the
 * confirmed delivery. The comparison is never against a figure someone re-typed: the price is the order's agreed
 * price, and the quantity is what the delivery checks actually accepted.
 */

/** A rounding difference of this much per unit is not a price difference. */
export const PRICE_ROUNDING = 1;

export type MatchIssue = 'price_differs' | 'over_delivered' | 'over_ordered' | 'unknown_item';

/** `matched`: clean. `partial`: clean, and only part of the order is billed so far. `adjusted`: the price differs and an approved change
 *  explains it. `awaiting_delivery`: billed ahead of any delivery, not wrong yet. `mismatch`: something to resolve. */
export type LineVerdict = 'matched' | 'partial' | 'adjusted' | 'awaiting_delivery' | 'mismatch';

export interface MatchLineInput {
  /** The order line, or null for an item that is not on the order. */
  order: { quantity: number; price: number } | null;
  /** Quantity the delivery checks accepted for this line so far. */
  delivered: number;
  /** Quantity already billed on this supplier's other open invoices for the line. */
  billedElsewhere: number;
  invoiced: { quantity: number; unitPrice: number; adjustmentPrice?: number };
}

export interface LineMatch {
  verdict: LineVerdict;
  issues: MatchIssue[];
  quantityCheck: 'ok' | 'awaiting' | 'fail';
  priceCheck: 'ok' | 'explained' | 'fail';
  /** The price gap per unit, invoice minus order. */
  priceGap: number;
  /** Whether this line's payment is unlocked. */
  unlocked: boolean;
}

export function matchLine(i: MatchLineInput): LineMatch {
  if (!i.order) return { verdict: 'mismatch', issues: ['unknown_item'], quantityCheck: 'fail', priceCheck: 'fail', priceGap: 0, unlocked: false };
  const issues: MatchIssue[] = [];
  const priceGap = i.invoiced.unitPrice - i.order.price;
  let priceCheck: LineMatch['priceCheck'] = 'ok';
  if (Math.abs(priceGap) > PRICE_ROUNDING) {
    const explained = i.invoiced.adjustmentPrice !== undefined && Math.abs(i.invoiced.adjustmentPrice - i.invoiced.unitPrice) <= PRICE_ROUNDING;
    priceCheck = explained ? 'explained' : 'fail';
    if (!explained) issues.push('price_differs');
  }
  const billedTotal = i.billedElsewhere + i.invoiced.quantity;
  let quantityCheck: LineMatch['quantityCheck'] = 'ok';
  if (billedTotal > i.order.quantity) {
    quantityCheck = 'fail';
    issues.push('over_ordered');
  } else if (i.delivered <= 0) {
    quantityCheck = 'awaiting';
  } else if (billedTotal > i.delivered) {
    quantityCheck = 'fail';
    issues.push('over_delivered');
  }
  let verdict: LineVerdict;
  if (issues.length > 0) verdict = 'mismatch';
  else if (quantityCheck === 'awaiting') verdict = 'awaiting_delivery';
  else if (priceCheck === 'explained') verdict = 'adjusted';
  else verdict = billedTotal < i.order.quantity ? 'partial' : 'matched';
  return { verdict, issues, quantityCheck, priceCheck, priceGap, unlocked: verdict === 'matched' || verdict === 'partial' || verdict === 'adjusted' };
}

export type InvoiceMatchStatus = 'matched' | 'awaiting_delivery' | 'mismatch' | 'rejected';

/** One word for the whole invoice: any mismatch is a mismatch; otherwise waiting beats matched. */
export function overallOf(verdicts: LineVerdict[]): Exclude<InvoiceMatchStatus, 'rejected'> {
  if (verdicts.some((v) => v === 'mismatch')) return 'mismatch';
  if (verdicts.some((v) => v === 'awaiting_delivery')) return 'awaiting_delivery';
  return 'matched';
}

/** Why an order's payment cannot proceed on a clean invoice yet, or `ok` when it can. */
export type InvoiceGate = 'ok' | 'no_invoice' | 'mismatch' | 'incomplete' | 'awaiting_delivery';

export interface GateLine {
  ordered: number;
  /** Quantity on non-rejected invoices whose line is unlocked. */
  unlocked: number;
}

export function gateOf(hasInvoice: boolean, anyMismatch: boolean, anyAwaiting: boolean, lines: GateLine[]): InvoiceGate {
  if (!hasInvoice) return 'no_invoice';
  if (anyMismatch) return 'mismatch';
  if (lines.every((l) => l.unlocked >= l.ordered)) return 'ok';
  return anyAwaiting ? 'awaiting_delivery' : 'incomplete';
}

/** A price change only explains an invoice if it was approved for this supplier and came in after the order went out. */
export function explainsInvoicePrice(change: { supplierId: string; status: string; toPrice: number; requestedAt: string }, supplierId: string, poSentAt: string | undefined, invoicedPrice: number): boolean {
  return change.supplierId === supplierId && change.status === 'applied' && !!poSentAt && change.requestedAt > poSentAt && Math.abs(change.toPrice - invoicedPrice) <= PRICE_ROUNDING;
}

export const INVOICE_MIN_ITEMS = 1;
