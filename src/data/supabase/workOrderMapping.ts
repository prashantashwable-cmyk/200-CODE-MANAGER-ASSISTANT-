import type { LineKind } from '@/features/quotes/facilitatorQuote';
import { acceptanceLabel, permissionsOf, sideOf, startProblem } from '@/features/workorders/workOrder';
import type { Milestone, MilestoneGate, MilestoneStatus, WorkOrderStatus } from '@/features/workorders/workOrder';
import type { WorkOrderView } from '@/features/workorders/types';

/** Row shapes as the database returns them (supabase/migrations/20261015000001_work_orders.sql). */
export interface WorkOrderRow {
  id: string; code: string; quote_id: string; line_id: string; lead_ref: string; site_name: string; customer_id: string;
  partner_ref: string; partner_name: string; partner_profile_id: string; kind: LineKind; description: string; price_inr: number | string;
  status: WorkOrderStatus; customer_accepted_at: string | null; partner_accepted_at: string | null; started_at: string | null; created_at: string;
}
export interface MilestoneRow {
  work_order_id: string; milestone_id: string; position: number; label: string; gate: MilestoneGate; pct: number; amount_inr: number | string;
  status: MilestoneStatus; evidence: string[];
}

const milestoneFromRow = (m: MilestoneRow): Milestone => ({ id: m.milestone_id, label: m.label, gate: m.gate, pct: m.pct, amountInr: Number(m.amount_inr), status: m.status, evidence: [...m.evidence] });

/**
 * One order as the screens see it. What the caller may do next comes from the same rules the in-memory repository uses;
 * the database still refuses anything not allowed, so this only decides which buttons to show.
 */
export function workOrderFromRows(w: WorkOrderRow, ms: MilestoneRow[], caller: { id: string; role: string | undefined }): WorkOrderView {
  const mine = ms.filter((m) => m.work_order_id === w.id).sort((a, b) => a.position - b.position);
  const base = {
    id: w.id, code: w.code, quoteId: w.quote_id, lineId: w.line_id, leadId: w.lead_ref, siteName: w.site_name, customerId: w.customer_id,
    partnerId: w.partner_ref, partnerName: w.partner_name, partnerAccountId: w.partner_profile_id, kind: w.kind, description: w.description,
    priceInr: Number(w.price_inr), status: w.status, milestones: mine.map(milestoneFromRow), createdAt: w.created_at,
    ...(w.customer_accepted_at ? { customerAcceptedAt: w.customer_accepted_at } : {}),
    ...(w.partner_accepted_at ? { partnerAcceptedAt: w.partner_accepted_at } : {}),
    ...(w.started_at ? { startedAt: w.started_at } : {}),
  };
  const side = sideOf(caller.id, base);
  // The partner reading their own order is active by construction (a suspended account is refused by the start function itself).
  const startBlock = startProblem(base, { licenceValid: true, insuranceValid: true, suspended: false });
  return { ...base, side, startBlock, acceptance: acceptanceLabel('not_connected'), can: permissionsOf({ side, role: caller.role, status: base.status, customerAcceptedAt: base.customerAcceptedAt, partnerAcceptedAt: base.partnerAcceptedAt, startBlock }) };
}

/** The database raises short codes; anything else is a network-level failure. */
export function workOrderErrorCode(message: string): string {
  const hit = /forbidden|not_found|invalid_state|wrong_state|partner_account_required|partner_not_eligible|no_customer|not_accepted_by_customer|not_accepted_by_partner|partner_suspended|evidence_missing|evidence_too_many|evidence_name_long|not_waiting|not_submitted|not_payable|self_verify|reference_short|reference_long|milestone_is_locked|milestone_is_fixed|work_order_is_closed|work_order_is_fixed|acceptance_is_kept|milestones_open|not_accepted|locked|duplicate key|permission denied|row-level security|invalid input syntax/.exec(message)?.[0];
  if (!hit) return 'network';
  return ({ 'duplicate key': 'invalid_state', 'permission denied': 'forbidden', 'row-level security': 'forbidden', 'invalid input syntax': 'not_found', milestone_is_locked: 'locked', milestone_is_fixed: 'invalid_state', work_order_is_closed: 'invalid_state', work_order_is_fixed: 'invalid_state', acceptance_is_kept: 'invalid_state', milestones_open: 'invalid_state', not_accepted: 'invalid_state' } as Record<string, string>)[hit] ?? hit;
}
