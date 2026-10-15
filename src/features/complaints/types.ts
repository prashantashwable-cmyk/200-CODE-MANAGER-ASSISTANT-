import type { ComplaintCategory, ComplaintOutcome, ComplaintStatus, TrustSummary } from './complaint';

/** A complaint as the caller may see it. `partnerName` is shown to staff only; `can` says what the caller may do next (the server still decides). */
export interface ComplaintView {
  id: string;
  code: string;
  quoteId: string;
  siteName: string;
  workOrderId?: string;
  workOrderCode?: string;
  partnerName?: string;
  partnerAccountId?: string;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  ackDueAt: string;
  overdue: boolean;
  acknowledgedAt?: string;
  resolvedAt?: string;
  outcome?: ComplaintOutcome;
  resolutionNote?: string;
  can: { acknowledge: boolean; resolve: boolean };
}
export interface RaiseComplaintInput { quoteId: string; workOrderId?: string; category: ComplaintCategory; text: string; clientId: string; }
export type { TrustSummary };
