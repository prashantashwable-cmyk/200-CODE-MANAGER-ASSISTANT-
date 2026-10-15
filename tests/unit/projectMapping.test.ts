import { describe, expect, it } from 'vitest';
import { projectFromJson } from '@/data/supabase/projectMapping';
import type { ProjectJson } from '@/data/supabase/projectMapping';
import type { WorkOrderView } from '@/features/workorders/types';

const json = (over: Partial<ProjectJson> = {}): ProjectJson => ({ quoteId: 'q1-uuid-0001', siteName: 'Heights', percent: 54, amounts: { verifiedInr: '540001', paidInr: 0, totalInr: '1000001' }, ready: true, qcMissing: false, complete: false,
  parties: [{ role: 'customer', accountId: 'c', name: 'Cust', signed: false }, { role: 'installer', accountId: 't', name: 'Tech', signed: true }], ...over });
const order = { id: 'w1', code: 'AIEC-WO-1', quoteId: 'q1-uuid-0001', kind: 'installation', partnerName: 'Tech', status: 'in_progress' } as WorkOrderView;

describe('project mapping', () => {
  it('turns database numbers into numbers and keeps only this project\'s orders', () => {
    const v = projectFromJson(json(), [order, { ...order, id: 'w2', quoteId: 'other' } as WorkOrderView], 'AIEC-FQ-1', 'c');
    expect(v).toMatchObject({ code: 'AIEC-FQ-1', percent: 54, amounts: { verifiedInr: 540001, totalInr: 1000001 } });
    expect(v.orders.map((o) => o.id)).toEqual(['w1']);
  });
  it('shows no amounts when the database sends none, and falls back to a short id when the quote cannot be read', () => {
    const v = projectFromJson(json({ amounts: null }), [order], undefined, 't');
    expect(v.amounts).toBeNull();
    expect(v.code).toBe('q1-uuid-');
  });
  it('lets a party acknowledge only when they have not and the project is ready with an inspector named', () => {
    expect(projectFromJson(json(), [order], 'x', 'c').handover.canAcknowledge).toBe(true);
    expect(projectFromJson(json(), [order], 'x', 't').handover.canAcknowledge).toBe(false); // already signed
    expect(projectFromJson(json({ ready: false }), [order], 'x', 'c').handover.canAcknowledge).toBe(false);
    expect(projectFromJson(json({ qcMissing: true }), [order], 'x', 'c').handover.canAcknowledge).toBe(false);
    expect(projectFromJson(json(), [order], 'x', 'stranger').handover.canAcknowledge).toBe(false);
    expect(projectFromJson(json(), [order], 'x', 'c').handover.parties.find((p) => p.accountId === 'c')?.mine).toBe(true);
  });
});
