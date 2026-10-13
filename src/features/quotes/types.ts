import type { FeeSettings, CostRates, QuoteLine, QuoteTotals, FeeBand, Waterfall, Alternative, QuoteProblem, FeeActor } from './facilitatorQuote';

export interface FeeSettingsVersion {
  version: number;
  settings: FeeSettings;
  costRates: CostRates;
  setByName: string;
  reason: string;
  at: string;
}

export interface QuoteComponent extends QuoteLine {
  /** Set when the customer accepted this partner's component. */
  acceptedAt?: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'partly_accepted' | 'accepted' | 'rejected';

export interface FacilitatorQuote {
  id: string;
  code: string;
  leadId: string;
  siteName: string;
  customerId?: string;
  components: QuoteComponent[];
  bundleDiscountInr: number;
  /** The fee settings version this quote was priced on: a later change never re-prices it. */
  feeVersion: number;
  totals: QuoteTotals;
  status: QuoteStatus;
  createdAt: string;
  createdByName: string;
  sentAt?: string;
  clientEventId?: string;
}

export interface QuotePreview {
  totals: QuoteTotals;
  problems: QuoteProblem[];
  band: FeeBand;
  /** Who is asking, and whether that actor may offer this fee without the Owner. */
  actor: FeeActor;
  allowed: boolean;
  maxDiscountInr: number;
  waterfall: Waterfall;
  alternatives: Alternative[];
  feeVersion: number;
}

export interface SaveQuoteInput {
  leadId: string;
  lines: QuoteLine[];
  bundleDiscountInr?: number;
  clientEventId: string;
}

export type SaveQuoteResult =
  | { status: 'saved'; quote: FacilitatorQuote }
  | { status: 'needs_owner'; cardId: string; preview: QuotePreview };

/** What a customer sees: their partners' prices and the disclosed fee, never the platform's costs. */
export interface CustomerQuoteView {
  quote: Pick<FacilitatorQuote, 'id' | 'code' | 'siteName' | 'status' | 'sentAt'> & { components: QuoteComponent[]; bundleDiscountInr: number; totals: QuoteTotals };
  tokenInr: number;
}
