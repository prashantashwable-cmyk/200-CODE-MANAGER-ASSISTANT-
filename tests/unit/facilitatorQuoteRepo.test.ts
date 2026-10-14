/** Facilitator quotes through the Repository the screens use. A server must keep all of these. */
import { beforeAll, describe, expect, it } from 'vitest';
import { chaos } from '@/data/repository';
import type { Repository } from '@/data/repository';
import { DEFAULT_COST_RATES, DEFAULT_FEE_SETTINGS } from '@/features/quotes/facilitatorQuote';
import type { QuoteLine } from '@/features/quotes/facilitatorQuote';

let repo: Repository;
const OWNER = 'u-owner-1';
const ADMIN = 'u-admin-1';
const CUST = 'u-cust-3';
const OTHER_CUST = 'u-cust-1';
const refusal = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return e instanceof Error ? e.message : String(e); } };
const lines: QuoteLine[] = [
  { id: 'a', partnerId: 'sp-1', partnerName: 'Vertex', kind: 'material', description: 'm', partnerPriceInr: 1_000_000 },
  { id: 'b', partnerId: 'u-tech-1', partnerName: 'Santosh', kind: 'installation', description: 'i', partnerPriceInr: 200_000 },
];

beforeAll(async () => {
  chaos.minLatency = 0; chaos.maxLatency = 0; chaos.failureRate = 0;
  repo = (await import('@/data/memoryRepository')).memoryRepository;
});

describe('fee settings', () => {
  it('only the Owner changes the fee, with a reason, and history is kept', async () => {
    expect(await refusal(repo.saveFeeSettings(ADMIN, DEFAULT_FEE_SETTINGS, DEFAULT_COST_RATES, 'trying to lower it'))).toBe('owner_only');
    expect(await refusal(repo.saveFeeSettings(OWNER, DEFAULT_FEE_SETTINGS, DEFAULT_COST_RATES, 'short'))).toBe('reason_short');
    expect(await refusal(repo.saveFeeSettings(OWNER, { ...DEFAULT_FEE_SETTINGS, humanFloorPct: 99 }, DEFAULT_COST_RATES, 'a proper reason here'))).toBe('floors_order');
    const before = (await repo.getFeeSettings(OWNER)).current.version;
    const v = await repo.saveFeeSettings(OWNER, { ...DEFAULT_FEE_SETTINGS, targetPct: 55 }, DEFAULT_COST_RATES, 'Pilot at a lower target');
    expect(v.version).toBe(before + 1);
    expect((await repo.getFeeSettings(ADMIN)).history.length).toBeGreaterThan(1);
    await repo.saveFeeSettings(OWNER, DEFAULT_FEE_SETTINGS, DEFAULT_COST_RATES, 'Back to the starting values');
  });
  it('customers and partners cannot read the platform fee settings or costs', async () => {
    expect(await refusal(repo.getFeeSettings(CUST))).toBe('forbidden');
    expect(await refusal(repo.previewFacilitatorQuote('u-tech-1', { lines }))).toBe('forbidden');
  });
});

describe('saving a quote', () => {
  it('the Owner saves at any band; Admin below its floor creates an Owner decision instead', async () => {
    const ok = await repo.saveFacilitatorQuote(OWNER, { leadId: 'l-3', lines, clientEventId: 'q-1' });
    expect(ok.status).toBe('saved');
    const again = await repo.saveFacilitatorQuote(OWNER, { leadId: 'l-3', lines, clientEventId: 'q-1' });
    expect(again.status === 'saved' && ok.status === 'saved' && again.quote.id === ok.quote.id).toBe(true);
    const deep = await repo.saveFacilitatorQuote(ADMIN, { leadId: 'l-3', lines, bundleDiscountInr: 700_000, clientEventId: 'q-2' });
    expect(deep.status).toBe('needs_owner');
    const cards = await repo.listDecisionCards(OWNER, { status: 'open', kind: 'fee_change' });
    expect(JSON.stringify(cards)).toContain('Fee below');
  });
  it('a later fee change does not re-price a saved quote', async () => {
    const list = await repo.listFacilitatorQuotes(OWNER);
    const q = list.find((x) => x.clientEventId === 'q-1')!;
    await repo.saveFeeSettings(OWNER, { ...DEFAULT_FEE_SETTINGS, targetPct: 40 }, DEFAULT_COST_RATES, 'Testing re-pricing');
    const after = (await repo.listFacilitatorQuotes(OWNER)).find((x) => x.id === q.id)!;
    expect(after.totals.feeInr).toBe(q.totals.feeInr);
    expect(after.feeVersion).toBe(q.feeVersion);
    await repo.saveFeeSettings(OWNER, DEFAULT_FEE_SETTINGS, DEFAULT_COST_RATES, 'Back to the starting values');
  });
});

describe('customer acceptance', () => {
  it('shows partner prices and the fee, never platform costs; accepts per component; only the quote’s own customer', async () => {
    const mine = await repo.getMyQuote(CUST);
    expect(mine).not.toBeNull();
    expect(JSON.stringify(mine)).not.toContain('waterfall');
    expect(mine!.quote.totals.feeInr).toBeGreaterThan(0);
    expect(await refusal(repo.acceptQuoteComponents(OTHER_CUST, mine!.quote.id, ['c1']))).toBe('not_found');
    const part = await repo.acceptQuoteComponents(CUST, mine!.quote.id, ['c1']);
    expect(part.quote.status).toBe('partly_accepted');
    const done = await repo.acceptQuoteComponents(CUST, mine!.quote.id, ['c2', 'c3', 'c4']);
    expect(done.quote.status).toBe('accepted');
    expect(await refusal(repo.acceptQuoteComponents(CUST, mine!.quote.id, ['c1']))).toBe('invalid_state');
  });
  it('acceptance is on the event log, visible to the customer for their own project', async () => {
    const ev = await repo.listEvents(CUST, { type: 'quote.component_accepted' });
    expect(ev.length).toBeGreaterThanOrEqual(4);
  });
});
