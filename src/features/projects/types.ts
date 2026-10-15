import type { LineKind } from '@/features/quotes/facilitatorQuote';
import type { WorkOrderStatus } from '@/features/workorders/workOrder';
import type { HandoverRole } from './project';

export interface ProjectOrderLine { id: string; code: string; kind: LineKind; partnerName: string; status: WorkOrderStatus; }
export interface HandoverPartyView { role: HandoverRole; accountId: string; name: string; signed: boolean; mine: boolean; }
/** One project (a quote's work orders) as the caller may see it. Amounts are present only for staff and the customer. */
export interface ProjectView {
  quoteId: string;
  code: string;
  siteName: string;
  percent: number;
  amounts: { verifiedInr: number; paidInr: number; totalInr: number } | null;
  orders: ProjectOrderLine[];
  handover: { ready: boolean; qcMissing: boolean; complete: boolean; parties: HandoverPartyView[]; canAcknowledge: boolean };
}
