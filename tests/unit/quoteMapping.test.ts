import { describe, expect, it } from 'vitest';
import { computeQuote, DEFAULT_FEE_SETTINGS } from '@/features/quotes/facilitatorQuote';
import { customerViewOf, errorCode, quoteFromRow } from '@/data/supabase/quoteMapping';
import type { QuoteRow } from '@/data/supabase/quoteMapping';

const lines = [{ id: 'c1', partnerId: 'a', partnerName: 'A', kind: 'material' as const, description: 'm', partnerPriceInr: 100_000 }, { id: 'c2', partnerId: 'b', partnerName: 'B', kind: 'installation' as const, description: 'i', partnerPriceInr: 50_000 }];
const row: QuoteRow = { id: 'q1', code: 'AIEC-FQ-3001', lead_ref: 'l-3', site_name: 'Test', customer_id: 'u1', components: lines, bundle_discount_inr: 0, fee_version: 1, totals: computeQuote({ lines, settings: DEFAULT_FEE_SETTINGS }), status: 'sent', created_by_name: 'Owner', created_at: '2026-10-14T00:00:00Z', sent_at: '2026-10-14T01:00:00Z', client_event_id: null };

describe('server row mapping (the shapes the screens already use)', () => {
  it('folds acceptances onto components and keeps the server totals', () => {
    const q = quoteFromRow(row, [{ quote_id: 'q1', line_id: 'c1', accepted_at: '2026-10-14T02:00:00Z' }, { quote_id: 'other', line_id: 'c2', accepted_at: 'x' }]);
    expect(q.components[0].acceptedAt).toBe('2026-10-14T02:00:00Z');
    expect(q.components[1].acceptedAt).toBeUndefined();
    expect(q.totals.feeInr).toBe(90_000);
    expect(q.sentAt).toBe('2026-10-14T01:00:00Z');
  });
  it('the customer view carries no platform costs', () => {
    expect(JSON.stringify(customerViewOf(quoteFromRow(row)))).not.toMatch(/waterfall|scout|margin/i);
  });
  it('turns database errors into the codes the screens know', () => {
    expect(errorCode('owner_only')).toBe('owner_only');
    expect(errorCode('new row violates row-level security policy')).toBe('forbidden');
    expect(errorCode('duplicate key value violates unique constraint')).toBe('invalid_state');
    expect(errorCode('fetch failed')).toBe('network');
  });
});
