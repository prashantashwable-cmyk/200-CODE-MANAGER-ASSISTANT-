/**
 * Facilitator quote maths (master prompt P0.5 / P0.6), pure.
 *
 * Under Mode F a quote is the itemised sum of each partner's OWN price plus a
 * separately DISCLOSED platform facilitation fee. Partner prices are
 * pass-through and never platform revenue; the platform negotiates only its
 * own fee. All money is whole rupees (rounded half up at each stated step).
 *
 * Every default below is a placeholder for the Owner: [ASSUMPTION].
 */

export type CommercialMode = 'F' | 'P';
export type LineKind = 'material' | 'installation' | 'logistics' | 'amc' | 'statutory';
export type FeeStyle = 'markup' | 'fixed' | 'tiered';

export interface FeeTier {
  /** Partner-cost base up to (and including) this amount; null = no upper limit. */
  upToInr: number | null;
  pct: number;
}

export interface FeeSettings {
  mode: CommercialMode;
  style: FeeStyle;
  /** Markup on partner cost, %. Target [ASSUMPTION] 60. */
  targetPct: number;
  /** Lowest the assistant may offer on its own (half the target). */
  assistantFloorPct: number;
  /** Lowest a human sales executive may offer. */
  humanFloorPct: number;
  fixedFeeInr: number;
  tiers: FeeTier[];
  /** GST on the fee, % [VERIFY with the accountant]. */
  gstPctOnFee: number;
  /** Booking token paid to the platform, credited against the fee (INR). */
  tokenInr: number;
}

export const DEFAULT_FEE_SETTINGS: FeeSettings = {
  mode: 'F',
  style: 'markup',
  targetPct: 60,
  assistantFloorPct: 30,
  humanFloorPct: 20,
  fixedFeeInr: 150_000,
  tiers: [
    { upToInr: 500_000, pct: 60 },
    { upToInr: 1_500_000, pct: 40 },
    { upToInr: null, pct: 30 },
  ],
  gstPctOnFee: 18,
  tokenInr: 10_000,
};

export interface QuoteLine {
  id: string;
  partnerId: string;
  partnerName: string;
  kind: LineKind;
  description: string;
  /** The partner's own price (INR). Only that partner may change it. */
  partnerPriceInr: number;
}

export const round = (n: number) => Math.round(n);

/** Partner prices the fee is charged on: everything except statutory pass-through. */
export function feeBaseInr(lines: QuoteLine[]): number {
  return lines.filter((l) => l.kind !== 'statutory').reduce((s, l) => s + l.partnerPriceInr, 0);
}

export function partnerTotalInr(lines: QuoteLine[]): number {
  return lines.reduce((s, l) => s + l.partnerPriceInr, 0);
}

/** The fee the settings produce for a base, before any discount. */
export function feeFor(baseInr: number, s: FeeSettings): number {
  if (baseInr <= 0) return 0;
  if (s.style === 'fixed') return s.fixedFeeInr;
  if (s.style === 'tiered') {
    // Marginal tiers: each slice of the base pays that tier's rate.
    let left = baseInr;
    let from = 0;
    let fee = 0;
    for (const t of s.tiers) {
      const top = t.upToInr ?? Infinity;
      const slice = Math.min(left, top - from);
      if (slice > 0) fee += (slice * t.pct) / 100;
      left -= Math.max(slice, 0);
      from = top;
      if (left <= 0) break;
    }
    return round(fee);
  }
  return round((baseInr * s.targetPct) / 100);
}

export type FeeBand = 'target' | 'assistant_ok' | 'human_only' | 'owner_approval';

/** Where an effective fee percentage (on partner cost) sits against the band. */
export function bandOf(effectivePct: number, s: FeeSettings): FeeBand {
  if (effectivePct >= s.targetPct) return 'target';
  if (effectivePct >= s.assistantFloorPct) return 'assistant_ok';
  if (effectivePct >= s.humanFloorPct) return 'human_only';
  return 'owner_approval';
}

export type FeeActor = 'assistant' | 'sales' | 'owner';

/** Whether this actor may offer a fee at that band without the Owner. */
export function mayOffer(band: FeeBand, actor: FeeActor): boolean {
  if (actor === 'owner') return true;
  if (band === 'target' || band === 'assistant_ok') return true;
  if (band === 'human_only') return actor === 'sales';
  return false;
}

export interface QuoteInput {
  lines: QuoteLine[];
  settings: FeeSettings;
  /** A bundle discount, funded ONLY from the fee (INR). */
  bundleDiscountInr?: number;
}

export interface QuoteTotals {
  baseInr: number;
  partnerTotalInr: number;
  grossFeeInr: number;
  bundleDiscountInr: number;
  feeInr: number;
  effectivePct: number;
  band: FeeBand;
  gstOnFeeInr: number;
  /** What the customer pays in total: partner prices + fee + GST on the fee. */
  customerTotalInr: number;
  /** Fee as a share of the customer's total, % — what the customer feels. */
  feeShareOfTotalPct: number;
  tokenInr: number;
  /** Fee still to pay after the token is credited (incl. GST on the fee). */
  feeAfterTokenInr: number;
}

export type QuoteProblem = 'no_lines' | 'bad_price' | 'discount_exceeds_fee' | 'mode_p';

export function quoteProblems(i: QuoteInput): QuoteProblem[] {
  const out: QuoteProblem[] = [];
  if (i.settings.mode !== 'F') out.push('mode_p');
  if (i.lines.length === 0) out.push('no_lines');
  if (i.lines.some((l) => !Number.isFinite(l.partnerPriceInr) || l.partnerPriceInr <= 0)) out.push('bad_price');
  const gross = feeFor(feeBaseInr(i.lines), i.settings);
  if ((i.bundleDiscountInr ?? 0) > gross || (i.bundleDiscountInr ?? 0) < 0) out.push('discount_exceeds_fee');
  return out;
}

export function computeQuote(i: QuoteInput): QuoteTotals {
  const baseInr = feeBaseInr(i.lines);
  const partnerTotal = partnerTotalInr(i.lines);
  const grossFee = feeFor(baseInr, i.settings);
  const discount = Math.min(Math.max(i.bundleDiscountInr ?? 0, 0), grossFee);
  const fee = grossFee - discount;
  const effectivePct = baseInr > 0 ? (fee / baseInr) * 100 : 0;
  const gst = round((fee * i.settings.gstPctOnFee) / 100);
  const customerTotal = partnerTotal + fee + gst;
  const token = Math.min(i.settings.tokenInr, fee + gst);
  return {
    baseInr,
    partnerTotalInr: partnerTotal,
    grossFeeInr: grossFee,
    bundleDiscountInr: discount,
    feeInr: fee,
    effectivePct: Math.round(effectivePct * 10) / 10,
    band: bandOf(effectivePct, i.settings),
    gstOnFeeInr: gst,
    customerTotalInr: customerTotal,
    feeShareOfTotalPct: customerTotal > 0 ? Math.round(((fee + gst) / customerTotal) * 1000) / 10 : 0,
    tokenInr: token,
    feeAfterTokenInr: fee + gst - token,
  };
}

/** The smallest fee an actor may offer for this base without the Owner. */
export function floorFeeInr(baseInr: number, s: FeeSettings, actor: FeeActor): number {
  const pct = actor === 'assistant' ? s.assistantFloorPct : actor === 'sales' ? s.humanFloorPct : 0;
  return round((baseInr * pct) / 100);
}

/** The largest bundle discount an actor may give: fee down to their floor. */
export function maxBundleDiscountInr(lines: QuoteLine[], s: FeeSettings, actor: FeeActor): number {
  const base = feeBaseInr(lines);
  return Math.max(0, feeFor(base, s) - floorFeeInr(base, s, actor));
}

// ---------- Principal-status flags (P0.4) ----------

export interface PrincipalSignals {
  /** The customer is shown a partner price different from the partner's own. */
  undisclosedMarkup: boolean;
  /** One invoice for the whole lift instead of per-partner documents. */
  singleInvoice: boolean;
  /** The fee is not shown as its own line to the customer. */
  feeNotSeparate: boolean;
}

export function principalRisk(sig: PrincipalSignals): { atRisk: boolean; reasons: (keyof PrincipalSignals)[] } {
  const reasons = (Object.keys(sig) as (keyof PrincipalSignals)[]).filter((k) => sig[k]);
  return { atRisk: reasons.length > 0, reasons };
}

// ---------- Platform P&L waterfall (P0.6) ----------

export interface CostRates {
  scoutCommissionPct: number; // of fee
  salesCommissionPct: number; // of fee
  qcFeeInr: number;
  mentorBonusPct: number; // of fee
  providerCostsInr: number; // payment + e-sign + WhatsApp + map, per deal
  infrastructurePct: number; // of fee
  reservePct: number; // dispute / assurance reserve, of fee
}

export const DEFAULT_COST_RATES: CostRates = {
  scoutCommissionPct: 5,
  salesCommissionPct: 5,
  qcFeeInr: 1_500,
  mentorBonusPct: 1,
  providerCostsInr: 2_000,
  infrastructurePct: 2,
  reservePct: 5,
};

export interface Waterfall {
  feeInr: number;
  scoutInr: number;
  salesInr: number;
  qcInr: number;
  mentorInr: number;
  providersInr: number;
  infrastructureInr: number;
  reserveInr: number;
  gstOnFeeInr: number; // collected and remitted: shown, not margin
  marginInr: number;
  marginPctOfFee: number;
}

export function waterfall(feeInr: number, gstOnFeeInr: number, r: CostRates): Waterfall {
  const scout = round((feeInr * r.scoutCommissionPct) / 100);
  const sales = round((feeInr * r.salesCommissionPct) / 100);
  const mentor = round((feeInr * r.mentorBonusPct) / 100);
  const infra = round((feeInr * r.infrastructurePct) / 100);
  const reserve = round((feeInr * r.reservePct) / 100);
  const margin = feeInr - scout - sales - r.qcFeeInr - mentor - r.providerCostsInr - infra - reserve;
  return {
    feeInr,
    scoutInr: scout,
    salesInr: sales,
    qcInr: r.qcFeeInr,
    mentorInr: mentor,
    providersInr: r.providerCostsInr,
    infrastructureInr: infra,
    reserveInr: reserve,
    gstOnFeeInr,
    marginInr: margin,
    marginPctOfFee: feeInr > 0 ? Math.round((margin / feeInr) * 1000) / 10 : 0,
  };
}

// ---------- Alternatives the Owner can compare (P0.5) ----------

export interface Alternative {
  id: 'markup' | 'fixed' | 'tiered' | 'split';
  feeInr: number;
  effectivePct: number;
  customerFeeInr: number;
  partnerFeeInr: number;
}

/** The same base priced four ways, so the Owner sees what each costs the customer. */
export function alternatives(baseInr: number, s: FeeSettings, partnerSharePct = 40): Alternative[] {
  const mk = (id: Alternative['id'], style: FeeStyle): Alternative => {
    const fee = feeFor(baseInr, { ...s, style });
    return { id, feeInr: fee, effectivePct: baseInr ? Math.round((fee / baseInr) * 1000) / 10 : 0, customerFeeInr: fee, partnerFeeInr: 0 };
  };
  const m = mk('markup', 'markup');
  const partnerPart = round((m.feeInr * partnerSharePct) / 100);
  return [
    m,
    mk('fixed', 'fixed'),
    mk('tiered', 'tiered'),
    { ...m, id: 'split', customerFeeInr: m.feeInr - partnerPart, partnerFeeInr: partnerPart },
  ];
}

export function settingsProblem(s: FeeSettings): string | null {
  if (!(s.humanFloorPct >= 0 && s.humanFloorPct <= s.assistantFloorPct && s.assistantFloorPct <= s.targetPct)) return 'floors_order';
  if (s.targetPct > 200) return 'target_too_high';
  if (s.gstPctOnFee < 0 || s.gstPctOnFee > 40) return 'gst_range';
  if (s.tokenInr < 0) return 'token_negative';
  if (s.style === 'tiered' && (s.tiers.length === 0 || s.tiers[s.tiers.length - 1].upToInr !== null)) return 'tiers_open_ended';
  return null;
}
