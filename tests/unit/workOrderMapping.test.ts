import { describe, expect, it } from 'vitest';
import { workOrderErrorCode, workOrderFromRows } from '@/data/supabase/workOrderMapping';
import type { MilestoneRow, WorkOrderRow } from '@/data/supabase/workOrderMapping';

const row = (over: Partial<WorkOrderRow> = {}): WorkOrderRow => ({
  id: 'w1', code: 'AIEC-WO-4001', quote_id: 'q1', line_id: 'c2', lead_ref: 'l-3', site_name: 'Test Heights', customer_id: 'cust', partner_ref: 't-1', partner_name: 'Santosh',
  partner_profile_id: 'tech', kind: 'installation', description: 'install', price_inr: '400000', status: 'issued', customer_accepted_at: null, partner_accepted_at: null, started_at: null, created_at: '2026-10-15T00:00:00Z', ...over,
});
const ms = (over: Partial<MilestoneRow>[] = [{}, {}]): MilestoneRow[] => over.map((o, i) => ({ work_order_id: 'w1', milestone_id: i === 0 ? 'progress' : 'handover', position: i + 1, label: `m${i}`, gate: i === 0 ? 'on_progress' : 'on_handover', pct: 50, amount_inr: '200000', status: 'waiting', evidence: [], ...o }));

describe('rows become the same view the in-memory repository gives', () => {
  it('turns database numbers into numbers, keeps milestone order and evidence, and labels acceptance honestly', () => {
    const v = workOrderFromRows(row(), [...ms()].reverse(), { id: 'cust', role: 'customer' });
    expect(v.priceInr).toBe(400000);
    expect(v.milestones.map((m) => m.id)).toEqual(['progress', 'handover']);
    expect(v.milestones[0].amountInr).toBe(200000);
    expect(v.leadId).toBe('l-3');
    expect(v.partnerAccountId).toBe('tech');
    expect(v.acceptance).toBe('in_app_acceptance');
    expect(v.customerAcceptedAt).toBeUndefined();
  });
  it('ignores milestones of other orders', () => {
    const v = workOrderFromRows(row(), [...ms(), { ...ms()[0], work_order_id: 'other', milestone_id: 'zzz' }], { id: 'cust', role: 'customer' });
    expect(v.milestones).toHaveLength(2);
  });
  it('decides the side from the account and the buttons from the order state', () => {
    const accepted = row({ customer_accepted_at: 'x', partner_accepted_at: 'y' });
    expect(workOrderFromRows(row(), ms(), { id: 'cust', role: 'customer' })).toMatchObject({ side: 'customer', can: { accept: true, start: false } });
    expect(workOrderFromRows(row(), ms(), { id: 'tech', role: 'technician' })).toMatchObject({ side: 'partner', startBlock: 'not_accepted_by_customer', can: { accept: true, start: false } });
    expect(workOrderFromRows(accepted, ms(), { id: 'tech', role: 'technician' })).toMatchObject({ startBlock: null, can: { accept: false, start: true } });
    expect(workOrderFromRows(accepted, ms(), { id: 'owner', role: 'owner' })).toMatchObject({ side: 'staff', can: { accept: false, start: false, verify: false } });
    const open = row({ status: 'in_progress', customer_accepted_at: 'x', partner_accepted_at: 'y', started_at: 'z' });
    expect(workOrderFromRows(open, ms(), { id: 'owner', role: 'owner' }).can.verify).toBe(true);
    expect(workOrderFromRows(open, ms(), { id: 'admin', role: 'admin' }).can.verify).toBe(false);
    expect(workOrderFromRows(open, ms(), { id: 'tech', role: 'technician' }).can).toMatchObject({ submitEvidence: true, recordPayment: false, verify: false });
    expect(workOrderFromRows(open, ms(), { id: 'cust', role: 'customer' }).can).toMatchObject({ submitEvidence: false, recordPayment: true });
  });
});

describe('QC inspector assignments', () => {
  it('attach to the right milestone, with a name only when the caller was allowed to read it', () => {
    const qc = [{ work_order_id: 'w1', milestone_id: 'handover', inspector_id: 'insp' }, { work_order_id: 'other', milestone_id: 'progress', inspector_id: 'zzz' }];
    const v = workOrderFromRows(row(), ms(), { id: 'owner', role: 'owner' }, qc, { insp: 'Anand' });
    expect(v.milestones[0].qcInspectorId).toBeUndefined();
    expect(v.milestones[1]).toMatchObject({ qcInspectorId: 'insp', qcInspectorName: 'Anand' });
    const anon = workOrderFromRows(row(), ms(), { id: 'cust', role: 'customer' }, qc, {});
    expect(anon.milestones[1].qcInspectorId).toBe('insp');
    expect(anon.milestones[1].qcInspectorName).toBeUndefined();
  });
  it('maps the new refusals', () => {
    for (const c of ['qc_inspector_required', 'inspector_is_partner', 'inspector_not_eligible']) expect(workOrderErrorCode(`ERROR: ${c}`)).toBe(c);
  });
});

describe('database errors become the codes the screens know', () => {
  it('maps the short codes, the locked milestone and the permission failures', () => {
    expect(workOrderErrorCode('partner_account_required')).toBe('partner_account_required');
    expect(workOrderErrorCode('error: not_accepted_by_partner')).toBe('not_accepted_by_partner');
    expect(workOrderErrorCode('milestone_is_locked')).toBe('locked');
    expect(workOrderErrorCode('locked')).toBe('locked');
    expect(workOrderErrorCode('milestones_open')).toBe('invalid_state');
    expect(workOrderErrorCode('permission denied for table work_orders')).toBe('forbidden');
    expect(workOrderErrorCode('new row violates row-level security policy')).toBe('forbidden');
    expect(workOrderErrorCode('invalid input syntax for type uuid: "wo-4001"')).toBe('not_found');
    expect(workOrderErrorCode('duplicate key value violates unique constraint')).toBe('invalid_state');
    expect(workOrderErrorCode('fetch failed')).toBe('network');
  });
});
