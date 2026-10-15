import { describe, expect, it } from 'vitest';
import { complaintFromRow, trustFromJson } from '@/data/supabase/complaintMapping';
import type { ComplaintRow, OrderBrief } from '@/data/supabase/complaintMapping';
import { workOrderErrorCode } from '@/data/supabase/workOrderMapping';

const row = (over: Partial<ComplaintRow> = {}): ComplaintRow => ({ id: 'c1', code: 'AIEC-CP-1001', quote_id: 'q1', work_order_id: 'w1', customer_id: 'cust', category: 'defect', description: 'The door sensor keeps failing', status: 'open',
  ack_due_at: '2026-10-16T10:00:00Z', acknowledged_at: null, resolved_at: null, outcome: null, resolution_note: null, created_at: '2026-10-15T10:00:00Z', ...over });
const order: OrderBrief = { id: 'w1', code: 'AIEC-WO-4001', site_name: 'Heights', partner_name: 'Santosh', partner_profile_id: 'tech', quote_id: 'q1' };

describe('complaint mapping', () => {
  it('shows the partner only to staff, marks overdue only while open, and offers the Owner the next step', () => {
    const late = Date.parse('2026-10-17T00:00:00Z');
    const owner = complaintFromRow(row(), order, { role: 'owner' }, late);
    expect(owner).toMatchObject({ partnerName: 'Santosh', partnerAccountId: 'tech', overdue: true, workOrderCode: 'AIEC-WO-4001', can: { acknowledge: true, resolve: false } });
    const customer = complaintFromRow(row(), order, { role: 'customer' }, late);
    expect(customer.partnerName).toBeUndefined();
    expect(customer.can).toEqual({ acknowledge: false, resolve: false });
    expect(complaintFromRow(row({ status: 'acknowledged' }), order, { role: 'owner' }, late)).toMatchObject({ overdue: false, can: { acknowledge: false, resolve: true } });
    expect(complaintFromRow(row({ status: 'resolved', outcome: 'upheld', resolution_note: 'Fixed', resolved_at: 'x' }), order, { role: 'admin' }, late)).toMatchObject({ outcome: 'upheld', resolutionNote: 'Fixed', can: { acknowledge: false, resolve: false } });
  });
  it('copes with a complaint that names no order', () => {
    const v = complaintFromRow(row({ work_order_id: null }), undefined, { role: 'customer' }, 0, 'Fallback');
    expect(v.workOrderId).toBeUndefined();
    expect(v.siteName).toBe('Fallback');
  });
  it('turns trust numbers into numbers and maps the new refusals', () => {
    expect(trustFromJson({ verifiedMilestones: '3' as never, closedMilestones: 1, complaintsRaised: 2, complaintsUpheld: 1 })).toEqual({ verifiedMilestones: 3, closedMilestones: 1, complaintsRaised: 2, complaintsUpheld: 1 });
    for (const c of ['category_invalid', 'text_short', 'text_long', 'not_open', 'not_acknowledged', 'outcome_invalid', 'note_short']) expect(workOrderErrorCode(`ERROR: ${c}`)).toBe(c);
    expect(workOrderErrorCode('complaint_is_locked')).toBe('locked');
  });
});
