import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COST_RATES, DEFAULT_FEE_SETTINGS as S, alternatives, bandOf, computeQuote, feeFor, mayOffer,
  maxBundleDiscountInr, principalRisk, quoteProblems, settingsProblem, waterfall, type QuoteLine,
} from '@/features/quotes/facilitatorQuote';

const L = (id: string, kind: QuoteLine['kind'], p: number): QuoteLine => ({ id, partnerId: 'p-' + id, partnerName: id, kind, description: id, partnerPriceInr: p });
const lines = [L('mat', 'material', 600_000), L('inst', 'installation', 300_000), L('log', 'logistics', 50_000), L('stat', 'statutory', 25_000)];

describe('facilitator quote', () => {
  it('charges the fee on partner cost excluding statutory pass-through', () => {
    const q = computeQuote({ lines, settings: S });
    expect(q.baseInr).toBe(950_000);
    expect(q.feeInr).toBe(570_000);
    expect(q.gstOnFeeInr).toBe(102_600);
    expect(q.customerTotalInr).toBe(975_000 + 570_000 + 102_600);
    expect(q.band).toBe('target');
  });
  it('keeps partner prices untouched by a bundle discount funded from the fee', () => {
    const q = computeQuote({ lines, settings: S, bundleDiscountInr: 100_000 });
    expect(q.partnerTotalInr).toBe(975_000);
    expect(q.feeInr).toBe(470_000);
    expect(q.effectivePct).toBe(49.5);
  });
  it('never discounts below zero fee and flags an oversized discount', () => {
    expect(computeQuote({ lines, settings: S, bundleDiscountInr: 9e9 }).feeInr).toBe(0);
    expect(quoteProblems({ lines, settings: S, bundleDiscountInr: 9e9 })).toContain('discount_exceeds_fee');
  });
  it('maps the 60/30/20 rule onto the band and who may offer', () => {
    expect(bandOf(60, S)).toBe('target');
    expect(bandOf(35, S)).toBe('assistant_ok');
    expect(bandOf(25, S)).toBe('human_only');
    expect(bandOf(19.9, S)).toBe('owner_approval');
    expect(mayOffer('human_only', 'assistant')).toBe(false);
    expect(mayOffer('human_only', 'sales')).toBe(true);
    expect(mayOffer('owner_approval', 'sales')).toBe(false);
    expect(mayOffer('owner_approval', 'owner')).toBe(true);
  });
  it('limits the discount to the actor floor', () => {
    expect(maxBundleDiscountInr(lines, S, 'assistant')).toBe(570_000 - 285_000);
    expect(maxBundleDiscountInr(lines, S, 'sales')).toBe(570_000 - 190_000);
  });
  it('tiered fee is marginal and fixed fee is flat', () => {
    expect(feeFor(2_000_000, { ...S, style: 'tiered' })).toBe(300_000 + 400_000 + 150_000);
    expect(feeFor(100, { ...S, style: 'fixed' })).toBe(150_000);
    expect(feeFor(0, S)).toBe(0);
  });
  it('credits the token against the fee', () => {
    const q = computeQuote({ lines, settings: S });
    expect(q.tokenInr).toBe(10_000);
    expect(q.feeAfterTokenInr).toBe(q.feeInr + q.gstOnFeeInr - 10_000);
  });
  it('waterfall leaves margin; GST on fee is not margin', () => {
    const q = computeQuote({ lines, settings: S });
    const w = waterfall(q.feeInr, q.gstOnFeeInr, DEFAULT_COST_RATES);
    expect(w.marginInr).toBe(570_000 - 28_500 - 28_500 - 1_500 - 5_700 - 2_000 - 11_400 - 28_500);
    expect(w.gstOnFeeInr).toBe(102_600);
  });
  it('offers four alternatives incl. a customer/partner split', () => {
    const a = alternatives(950_000, S);
    expect(a.map((x) => x.id)).toEqual(['markup', 'fixed', 'tiered', 'split']);
    const split = a[3];
    expect(split.customerFeeInr + split.partnerFeeInr).toBe(split.feeInr);
  });
  it('flags principal-status signals', () => {
    expect(principalRisk({ undisclosedMarkup: false, singleInvoice: false, feeNotSeparate: false }).atRisk).toBe(false);
    expect(principalRisk({ undisclosedMarkup: true, singleInvoice: true, feeNotSeparate: false }).reasons).toEqual(['undisclosedMarkup', 'singleInvoice']);
  });
  it('refuses bad input and mode P', () => {
    expect(quoteProblems({ lines: [], settings: S })).toContain('no_lines');
    expect(quoteProblems({ lines: [L('x', 'material', 0)], settings: S })).toContain('bad_price');
    expect(quoteProblems({ lines, settings: { ...S, mode: 'P' } })).toContain('mode_p');
    expect(settingsProblem({ ...S, humanFloorPct: 50 })).toBe('floors_order');
    expect(settingsProblem(S)).toBeNull();
  });
});
