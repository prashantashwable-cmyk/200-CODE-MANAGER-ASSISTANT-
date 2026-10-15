import { describe, expect, it } from 'vitest';
import { contractPackHtml, escapeHtml } from '@/features/workorders/contractPack';
import type { WorkOrderView } from '@/features/workorders/types';

const t = (k: string, v?: Record<string, string | number>) => `${k}${v ? JSON.stringify(v) : ''}`;
const order = (over: Partial<WorkOrderView> = {}): WorkOrderView => ({
  id: 'w1', code: 'AIEC-WO-4001', quoteId: 'q', lineId: 'c', leadId: 'l', siteName: 'Shree <Heights> & Co', customerId: 'c1', partnerId: 'p', partnerName: 'Santosh "Patil"', partnerAccountId: 'a',
  kind: 'installation', description: 'Install <script>alert(1)</script>', priceInr: 400000, status: 'issued', createdAt: '2026-10-15T00:00:00Z', templateVersion: 2,
  milestones: [{ id: 'm1', label: 'On progress', gate: 'on_progress', pct: 50, amountInr: 200000, status: 'waiting', evidence: [] }, { id: 'm2', label: 'On handover', gate: 'on_handover', pct: 50, amountInr: 200000, status: 'waiting', evidence: [] }],
  side: 'staff', can: { accept: false, start: false, submitEvidence: false, verify: false, assignQc: false, recordPayment: false, confirmPayment: false }, startBlock: null, acceptance: 'in_app_acceptance', ...over,
});

import { readinessKeys } from '@/features/workorders/workOrder';
describe('site readiness points', () => {
  it('each kind of work has its own points, the pass-through fee has none, and the pack lists them', () => {
    expect(readinessKeys('installation')).toHaveLength(3);
    expect(readinessKeys('amc')).toHaveLength(2);
    expect(readinessKeys('statutory')).toEqual([]);
    expect(contractPackHtml(order(), t, 'en', '2026-10-15T00:00:00Z')).toContain('workOrders.readiness.installation.3');
    expect(contractPackHtml(order({ kind: 'statutory' }), t, 'en', '2026-10-15T00:00:00Z')).not.toContain('workOrders.readiness.title');
  });
});

describe('contract pack', () => {
  it('escapes everything a person typed, so a name or description cannot inject markup', () => {
    const html = contractPackHtml(order(), t, 'en', '2026-10-15T00:00:00Z');
    expect(html).not.toContain('<script>');
    expect(html).toContain('Shree &lt;Heights&gt; &amp; Co');
    expect(html).toContain('Santosh &quot;Patil&quot;');
    expect(escapeHtml(`<>&"'`)).toBe('&lt;&gt;&amp;&quot;&#39;');
  });
  it('states the price, every milestone, the template version and that acceptance is in-app, not a signature', () => {
    const html = contractPackHtml(order(), t, 'en', '2026-10-15T00:00:00Z');
    expect(html).toContain('₹4,00,000');
    expect((html.match(/<tr><td>/g) ?? []).length).toBe(2);
    expect(html).toContain('workOrders.pack.template{&quot;version&quot;:2}');
    expect(html).toContain('workOrders.pack.inApp');
    expect(html).not.toContain('workOrders.pack.esigned');
    expect(html).not.toContain('workOrders.pack.mismatch');
  });
  it('shows acceptance dates when present, "not yet" when not, and flags milestones that do not add up', () => {
    const pending = contractPackHtml(order(), t, 'en', '2026-10-15T00:00:00Z');
    expect(pending.match(/workOrders\.pack\.pending/g)).toHaveLength(2);
    const accepted = contractPackHtml(order({ customerAcceptedAt: '2026-10-16T00:00:00Z', partnerAcceptedAt: '2026-10-17T00:00:00Z' }), t, 'en', '2026-10-15T00:00:00Z');
    expect(accepted).not.toContain('workOrders.pack.pending');
    const off = contractPackHtml(order({ priceInr: 399999 }), t, 'en', '2026-10-15T00:00:00Z');
    expect(off).toContain('workOrders.pack.mismatch');
  });
});
