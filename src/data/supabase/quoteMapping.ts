import type { CostRates, FeeSettings, QuoteTotals } from '@/features/quotes/facilitatorQuote';
import type { CustomerQuoteView, FacilitatorQuote, FeeSettingsVersion, QuoteComponent } from '@/features/quotes/types';

/** Row shapes as the database returns them (supabase/migrations/20261014000001_facilitator_quotes.sql). */
export interface FeeRow { version: number; settings: FeeSettings; cost_rates: CostRates; set_by_name: string; reason: string; created_at: string }
export interface QuoteRow {
  id: string; code: string; lead_ref: string; site_name: string; customer_id: string | null; components: QuoteComponent[];
  bundle_discount_inr: number; fee_version: number; totals: QuoteTotals; status: FacilitatorQuote['status'];
  created_by_name: string; created_at: string; sent_at: string | null; client_event_id: string | null;
}
export interface AcceptanceRow { quote_id: string; line_id: string; accepted_at: string }

export const feeFromRow = (r: FeeRow): FeeSettingsVersion => ({ version: r.version, settings: r.settings, costRates: r.cost_rates, setByName: r.set_by_name, reason: r.reason, at: r.created_at });

/** Acceptances live in their own table; fold them onto the components so the screens see one shape. */
export function quoteFromRow(r: QuoteRow, accepted: AcceptanceRow[] = []): FacilitatorQuote {
  const when = new Map(accepted.filter((a) => a.quote_id === r.id).map((a) => [a.line_id, a.accepted_at]));
  return {
    id: r.id, code: r.code, leadId: r.lead_ref, siteName: r.site_name, ...(r.customer_id ? { customerId: r.customer_id } : {}),
    components: r.components.map((c) => (when.has(c.id) ? { ...c, acceptedAt: when.get(c.id)! } : { ...c })),
    bundleDiscountInr: Number(r.bundle_discount_inr), feeVersion: r.fee_version, totals: r.totals, status: r.status,
    createdAt: r.created_at, createdByName: r.created_by_name, ...(r.sent_at ? { sentAt: r.sent_at } : {}), ...(r.client_event_id ? { clientEventId: r.client_event_id } : {}),
  };
}

export const customerViewOf = (q: FacilitatorQuote): CustomerQuoteView => ({
  quote: { id: q.id, code: q.code, siteName: q.siteName, status: q.status, ...(q.sentAt ? { sentAt: q.sentAt } : {}), components: q.components, bundleDiscountInr: q.bundleDiscountInr, totals: q.totals },
  tokenInr: q.totals.tokenInr,
});

/** The database raises short codes (owner_only, needs_owner, ...); anything else is a network-level failure. */
export function errorCode(message: string): string {
  return /owner_only|floors_order|target_too_high|gst_range|token_negative|needs_owner|discount_exceeds_fee|bad_price|mode_p|invalid_state|not_found|quote_is_priced|forbidden|duplicate key|row-level security|check constraint/.exec(message)?.[0]
    .replace('duplicate key', 'invalid_state').replace('row-level security', 'forbidden').replace('check constraint', 'reason_short') ?? 'network';
}
