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
  /** The partner as the quote named it (free text). */
  partnerId: string;
  partnerName: string;
  /** The account that acts for this partner, chosen by the Owner when the order is issued. */
  partnerAccountId: string;
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

/** An active partner account the Owner can bind to a quote component. */
export interface PartnerAccount { id: string; name: string; role: 'technician' | 'supplier'; }

export type ProviderId = 'esign' | 'payments' | 'whatsapp' | 'sms' | 'maps' | 'nbfc' | 'storage';
export interface ProviderStatus { id: ProviderId; connected: boolean; note: string; }
