import { isAckOverdue } from '@/features/complaints/complaint';
import type { ComplaintCategory, ComplaintOutcome, ComplaintStatus, TrustSummary } from '@/features/complaints/complaint';
import type { ComplaintView } from '@/features/complaints/types';

/** Row shape as the database returns it (supabase/migrations/20261015000005_complaints.sql). */
export interface ComplaintRow {
  id: string; code: string; quote_id: string; work_order_id: string | null; customer_id: string; category: ComplaintCategory; description: string; status: ComplaintStatus;
  ack_due_at: string; acknowledged_at: string | null; resolved_at: string | null; outcome: ComplaintOutcome | null; resolution_note: string | null; partner_reply: string | null; partner_replied_at: string | null; created_at: string;
}
export interface OrderBrief { id: string; code: string; site_name: string; partner_name: string; partner_profile_id: string; quote_id: string }

export function complaintFromRow(r: ComplaintRow, order: OrderBrief | undefined, caller: { role: string | undefined; userId?: string }, now: number, siteName = ''): ComplaintView {
  const staff = caller.role === 'owner' || caller.role === 'admin';
  return {
    id: r.id, code: r.code, quoteId: r.quote_id, siteName: order?.site_name ?? siteName, category: r.category, description: r.description, status: r.status,
    createdAt: r.created_at, ackDueAt: r.ack_due_at, overdue: isAckOverdue({ status: r.status, ackDueAt: r.ack_due_at }, now),
    ...(order ? { workOrderId: order.id, workOrderCode: order.code, ...(staff ? { partnerName: order.partner_name, partnerAccountId: order.partner_profile_id } : {}) } : {}),
    ...(r.acknowledged_at ? { acknowledgedAt: r.acknowledged_at } : {}), ...(r.resolved_at ? { resolvedAt: r.resolved_at } : {}),
    ...(r.outcome ? { outcome: r.outcome } : {}), ...(r.resolution_note ? { resolutionNote: r.resolution_note } : {}),
    ...(r.partner_reply ? { partnerReply: r.partner_reply, partnerRepliedAt: r.partner_replied_at ?? r.created_at } : {}),
    can: { acknowledge: caller.role === 'owner' && r.status === 'open', resolve: caller.role === 'owner' && r.status === 'acknowledged', reply: !!order && order.partner_profile_id === caller.userId && r.status !== 'resolved' && !r.partner_reply },
  };
}

export const trustFromJson = (j: { verifiedMilestones: number; closedMilestones: number; complaintsRaised: number; complaintsUpheld: number }): TrustSummary => ({
  verifiedMilestones: Number(j.verifiedMilestones), closedMilestones: Number(j.closedMilestones), complaintsRaised: Number(j.complaintsRaised), complaintsUpheld: Number(j.complaintsUpheld),
});
