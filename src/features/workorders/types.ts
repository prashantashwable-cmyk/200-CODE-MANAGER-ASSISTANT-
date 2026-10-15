import type { LineKind } from '@/features/quotes/facilitatorQuote';
import type { Milestone, WorkOrderStatus } from './workOrder';

export interface WorkOrder {
  id: string;
  code: string;
  quoteId: string;
  lineId: string;
  leadId: string;
  siteName: string;
  customerId: string;
  partnerId: string;
  partnerName: string;
  kind: LineKind;
  description: string;
  priceInr: number;
  status: WorkOrderStatus;
  milestones: Milestone[];
  customerAcceptedAt?: string;
  partnerAcceptedAt?: string;
  startedAt?: string;
  createdAt: string;
}

/** What each person may do with this order right now, decided by the server from who they are. */
export interface WorkOrderView extends WorkOrder {
  side: 'customer' | 'partner' | 'staff';
  can: { accept: boolean; start: boolean; submitEvidence: boolean; verify: boolean; recordPayment: boolean };
  startBlock: string | null;
  acceptance: 'in_app_acceptance' | 'esigned';
}

export type ProviderId = 'esign' | 'payments' | 'whatsapp' | 'sms' | 'maps' | 'nbfc' | 'storage';
export interface ProviderStatus { id: ProviderId; connected: boolean; note: string; }
