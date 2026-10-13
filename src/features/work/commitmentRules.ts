import { ASSIGN_DUE, DISPUTE_DECIDE_DUE, REVERIFY_DUE } from '@/features/qc/snags';
import { ARRANGE_DUE, FOLLOWUP_DUE, SIGNOFF_DUE_PRESENT, SIGNOFF_DUE_REMOTE } from '@/features/qc/walkthrough';
import { dueAtOf as sopDueAt } from '@/features/sop/rollout';
import { dueAtOf as feedbackDueAt, REVIEW_DUE_DAYS as FEEDBACK_REVIEW_DAYS } from '@/features/training/feedback';
import { REVIEW_DUE as PAYOUT_REVIEW_DUE } from '@/features/payout/dispute';
import { QUERY_DUE as PAYOUT_QUERY_DUE, QUERY_REPLY_DAYS as PAYOUT_QUERY_REPLY_DAYS } from '@/features/payout/history';
import { ATTENTION_DUE as PAYOUT_ATTENTION_DUE } from '@/features/commission/disbursement';
import { APPROVE_DUE as PAYOUT_APPROVE_DUE, HOLD_REVIEW as PAYOUT_HOLD_REVIEW } from '@/features/commission/payoutApproval';
import type { SopRollout, TrainingFeedback, TrainingAssignment, PartnerApplication, PartnerExit, TierDispute, TierReview, WarrantyRegistration, HandoverWalkthrough, ReworkRequest,
  Alert,
  AlertSeverity,
  CatalogPriceChange,
  SupplierOrderRating,
  SupplierAgreementVersion,
  DeliverySchedule,
  ShipmentLeg,
  SupplierMessage,
  AdvanceRecovery,
  BankFeed,
  ReconException,
  SupplierDispute,
  SupplierRetention,
  SupplierThread,
  CommitmentKind,
  CommitmentSubjectType,
  CounterOffer,
  Deal,
  DealTerms,
  DiscountRequest,
  FollowUpTask,
  Job,
  Lead,
  Payment,
  Quotation,
  Supplier,
  SupplierPurchaseOrder,
  User,
  DeliveryChecklist,
  DeliveryConfirmation,
  SiteCheckIn,
  JobSafetyTest,
  JobIssue,
  JobMaterialLog,
  JobHandoffNote,
  QcAssignment,
  QcMechCheck,
  QcFinding,
  DeliveryDelayCase,
  DeliveryDiscrepancyReport,
  DeliveryPartner,
  SupplierPayment,
} from '@/data/types';
import { remainingBalance } from '@/features/payments/aging';
import { STALE_AFTER } from '@/features/technician/presence';
import { RESOLVE_TARGET, pausesWork } from '@/features/technician/issues';
import { days, hours, minutes } from '@/features/sla/clock';
import { AT_RISK_RATIO, poStageEnteredAt, poStageOf, typicalStageDays } from '@/features/suppliers/fulfilment';
import { RENEWAL_NOTICE, agreementState, promisedDeliveryOf, versionsOf } from '@/features/suppliers/agreement';
import { SUPPLIER_REPLY_WINDOW, byAt } from '@/features/suppliers/threads';
import { RETENTION_DECISION_WINDOW, RETENTION_REVIEW_AFTER } from '@/features/suppliers/paymentTerms';
import { windowEndsAt } from '@/features/logistics/deliverySlots';
import type { InvoiceGate } from '@/features/suppliers/invoiceMatch';
import { CHECK_STALE_AFTER, handoverDueAt } from '@/features/tax/gst';
import { PROCESS_REVIEW_TARGET, dueAtOf } from '@/features/suppliers/disputes';
import { RECOVERY_CHASE_EVERY, RELEASE_DUE_AFTER } from '@/features/suppliers/exposure';
import { FEED_RESTORE_DUE, REVIEW_DUE, severityOf } from '@/features/finance/reconciliation';
import { MANUAL_UPDATE_EVERY } from '@/features/logistics/shipmentTracking';
import { SCREEN_DUE } from '@/features/recruitment/screening';
import { ARRANGE_DUE as INTERVIEW_ARRANGE_DUE, INVITE_WAIT } from '@/features/recruitment/interview';
import { PREPARE_DUE as OFFER_PREPARE_DUE, SIGN_WAIT as OFFER_SIGN_WAIT, STEPS_DUE as OFFER_STEPS_DUE } from '@/features/recruitment/agreement';
import { WAITLIST_REVIEW as WAITLIST_REVIEW_AFTER } from '@/features/recruitment/dashboard';
import { DISPUTE_DECIDE_DUE as TIER_DISPUTE_DUE } from '@/features/partners/tiers';
import { DISPUTE_DECIDE_DUE as EXIT_DISPUTE_DUE, INVOLUNTARY_WORK_DUE, PAY_DUE_AFTER_ACCESS, SETTLEMENT_DUE } from '@/features/partners/exit';
import { VERIFY_DUE, gateOf as verificationGate, requiredItemsOf as requiredVerification } from '@/features/recruitment/verification';

/**
 * The manager's rulebook: every dated promise the business runs on, as data.
 *
 * Each rule reads records that already exist and says, per obligation, who
 * owns it, when it's due, and whether it's still open. Nothing here stores
 * state or sends anything — `runFollowUpEngine` (memoryRepository.ts) turns
 * these into persisted Commitments and walks the nudge → overdue → escalate
 * ladder. That split is what lets the same rules run on a server scheduler
 * later without change.
 *
 * Chains ("follow-up completion of work") fall out of the records rather
 * than being wired by hand: sending a PO closes `po_send` and the same
 * record now yields `po_acknowledge` and `po_delivery`. A chain can't drift
 * out of step with the data, because it *is* the data.
 *
 * A new screen that introduces a new dated obligation adds a rule here.
 */

export interface CommitmentSources {
  now: number;
  users: User[];
  leads: Lead[];
  deals: Deal[];
  payments: Payment[];
  jobs: Job[];
  purchaseOrders: SupplierPurchaseOrder[];
  suppliers: Supplier[];
  quotations: Quotation[];
  dealTerms: DealTerms[];
  discountRequests: DiscountRequest[];
  counterOffers: CounterOffer[];
  alerts: Alert[];
  followUpTasks: FollowUpTask[];
  catalogPriceChanges: CatalogPriceChange[];
  orderRatings: SupplierOrderRating[];
  agreementVersions: SupplierAgreementVersion[];
  supplierThreads: SupplierThread[];
  supplierMessages: SupplierMessage[];
  supplierRetentions: SupplierRetention[];
  deliverySchedules: DeliverySchedule[];
  shipmentLegs: ShipmentLeg[];
  deliveryConfirmations: DeliveryConfirmation[];
  siteCheckIns: SiteCheckIn[];
  jobSafetyTests: JobSafetyTest[];
  jobIssues: JobIssue[];
  materialLogs: JobMaterialLog[];
  /** Notes left for the next person on a job, each with the person who has to read it (130). */
  handoffNotes: (JobHandoffNote & { ownerId: string | null })[];
  /** Jobs with everything done and more than one person on them, waiting for the lead to sign off (130). */
  leadSignOffs: { jobId: string; ownerId: string; doneAt: string }[];
  /** Quality-check assignments (131), and the jobs waiting for one. */
  qcAssignments: QcAssignment[];
  qcWaiting: { jobId: string; readyAt: string; assigned: boolean }[];
  /** Jobs whose mechanical and electrical checks are both signed off, and whether AIEC's compliance certificate has been issued (134). */
  qcCertificateWaiting: { jobId: string; readyAt: string; issued: boolean }[];
  /** Every defect / snag, open or closed (135). */
  snags: ReworkRequest[];
  /** Jobs whose final handover gate is clear, and whether Ready for Handover has been said (137). */
  handoverWaiting: { jobId: string; readyAt: string; ownerId: string | null; confirmed: boolean }[];
  /** Admin's optional final reviews (137). */
  handoverReviews: { jobId: string; addedAt: string; reason: string; done: boolean; doneAt?: string }[];
  /** Every job past Ready for Handover, with its customer walkthrough (138). */
  walkthroughs: { jobId: string; unlockedAt: string; leadId: string | null; customerId: string | null; w: HandoverWalkthrough }[];
  /** Warranty and AMC registrations (139). */
  warranties: WarrantyRegistration[];
  /** Projects with everything the completion certificate needs, and whether it has been issued (140). */
  completions: { jobId: string; readyAt: string; issued: boolean; issuedAt?: string }[];
  /** Partner applications (142). */
  applications: PartnerApplication[];
  /** Questions raised about a partner's tier, and partners put up for review after the criteria were raised (148). */
  tierDisputes: TierDispute[];
  tierReviews: TierReview[];
  /** Time-limited certifications: when each ends and whether a newer one has taken its place (155). */
  /** Training Admin assigned to a partner, by a date (157). */
  trainingAssignments: { a: TrainingAssignment; moduleCode: string; done: boolean; ownerActive: boolean }[];
  /** Admin's standing promise to look at workforce training compliance, due a month after the last look (158). */
  complianceReview: { dueAt: string; cycle: string; done: boolean };
  /** SOP rollouts: each affected partner's own acknowledgement, and Admin's look at what is still open (159). */
  /** Serious training feedback Admin has not dealt with, and the standing look at the routine kind (160). */
  tds: { deposits: { month: string; tds: number; due: string; done: boolean }[]; returns: { fy: string; quarter: number; due: string; done: boolean }[] };
  feedback: { outreach: { id: string; code: string; customer: string; dueAt: string; weakOnly: boolean }[]; recognitions: { id: string; userId: string; from: string; at: string }[] };
  /** A customer's referral reward, issued when the referred order was confirmed (179). */
  /** A category of automation someone paused (181): a stop is not meant to be forgotten, so Admin is asked a day later whether it is still on purpose. */
  automationPauses: { category: string; name: string; since: string; byName: string }[];
  /** The escalation matrix (184): a drill is owed on each scenario's own rhythm, and a gap a drill found is Admin's to put right within a day. */
  /** What a recovered outage left behind that still needs a person (186). */
  integrations: { followUps: { id: string; name: string; since: string; count: number }[]; rotations: { id: string; name: string; dueAt: string }[] };
  /** A rule that passed its sandbox tests and is still not live, and a scenario library nobody has reviewed in a while (190). */
  privacy: { requests: { id: string; name: string; type: string; dueAt: string }[]; notices: { id: string; version: number; dueAt: string }[]; reviews: { id: string; count: number; since: string }[] };
  security: { places: { id: string; userId: string; name: string; dueAt: string }[]; requests: { id: string; name: string; dueAt: string }[]; exceptions: { id: string; name: string; until: string }[]; locks: { id: string; userId: string; name: string; dueAt: string }[] };
  backups: { failures: { id: string; code: string; at: string }[]; test: { dueAt: string } | null; exports: { id: string; code: string; dueAt: string }[] };
  billing: { fixes: { id: string; name: string; dueAt: string }[]; renewals: { id: string; name: string; dueAt: string }[] };
  /** Wording a legal review found a problem with, and wording whose review is owed (198). */
  /** Help articles that need a person (wrong, out of date, a link that no longer works) and topics people suggested (199). */
  help: { content: { count: number; dueAt: string } | null; suggestions: { count: number; dueAt: string } | null };
  /** Suggestions about the app itself nobody has looked at (200). */
  appFeedback: { count: number; dueAt: string } | null;
  legal: { fixes: { id: string; name: string; dueAt: string }[]; reviews: { id: string; name: string; dueAt: string }[] };
  monitor: { checks: { adminId: string; day: string; dueAt: string }[]; concerns: { id: string; adminId: string; note: string; reviewAt: string }[] };
  permissions: { reviews: { id: string; name: string; screen: string; dueAt: string }[] };
  companyProfile: { verify: { id: string; version: number; dueAt: string }[] };
  sandbox: { promotions: { id: string; name: string; since: string }[]; review: { dueAt: string } | null };
  escalation: { drills: { id: string; name: string; dueAt: string }[]; gaps: { id: string; scenarioId: string; name: string; since: string }[] };
  referrals: { rewards: { id: string; userId: string; friend: string; at: string }[] };
  supportChats: { waiting: { id: string; name: string; since: string; urgent: boolean }[] };
  serviceTickets: { respond: { id: string; code: string; ownerUserId: string; dueAt: string; urgency: string; site: string }[]; visits: { id: string; code: string; technicianId: string; dueAt: string; site: string; date: string; state: 'open' | 'done' | 'cancelled' }[]; claims: { id: string; code: string; since: string }[]; followups: { id: string; code: string; since: string; unsafe: boolean }[] };
  payoutQueries: { open: { id: string; code: string; partnerName: string; entryId: string; since: string }[]; answered: { id: string; code: string; userId: string; entryId: string; at: string; route?: string }[]; disputes: { id: string; code: string; partnerName: string; entryId: string; dueAt: string }[]; reviews: { id: string; code: string; since: string }[] };
  contests: { live: { contestId: string; name: string; endsAt: string; userId: string; closing: boolean }[]; results: { contestId: string; name: string; userId: string; rank: number; total: number; early: boolean; closedAt: string; open: boolean }[] };
  payoutDisbursements: { attention: { count: number; oldestAt: string | null } };
  payoutApprovals: { pending: { count: number; oldestAt: string | null }; held: { id: string; partnerName: string; since: string }[] };
  commissionNotices: { ruleId: string; version: number; userId: string; role: 'surveyor' | 'technician'; effectiveFrom: string; from: string; to: string; open: boolean }[];
  trainingFeedback: { urgent: { f: TrainingFeedback; code: string; safety: boolean }[]; routine: { open: number; oldestAt: string | null } };
  sopRollouts: { acks: { r: SopRollout; userId: string; done: boolean; away: boolean }[]; closes: { r: SopRollout; pending: number }[] };
  certRenewals: { badgeId: string; userId: string; moduleId: string; moduleCode: string; expiresAt: string; renewed: boolean; ownerActive: boolean }[];
  /** Exits under way and how much of the partner's work is still in their hands (150). */
  exits: { exit: PartnerExit; workOpen: number; finishing: number }[];
  /** Mechanical quality-check attempts and the differences from the install record the inspector raised (132). */
  qcMechChecks: QcMechCheck[];
  qcFindings: QcFinding[];
  deliveryChecklists: DeliveryChecklist[];
  delayCases: DeliveryDelayCase[];
  discrepancyReports: DeliveryDiscrepancyReport[];
  deliveryPartners: DeliveryPartner[];
  supplierPayments: SupplierPayment[];
  /** Sent orders whose delivery is confirmed, with whether the supplier's invoice clears them for payment (113). */
  invoiceGates: { poId: string; supplierId: string; deliveredAt: string; gate: InvoiceGate }[];
  /** Invoices that ever failed the three-way match, with whether they still do (113). */
  invoiceMismatches: { invoiceId: string; poId: string; supplierId: string; invoiceNumber: string; notifiedAt: string; stillMismatched: boolean; resolvedAt?: string }[];
  /** Supplier payment disputes (117). */
  supplierDisputes: SupplierDispute[];
  /** Bank statement lines and records that did not match cleanly (120). */
  reconciliationExceptions: ReconException[];
  /** Whether the bank connection is delivering statements (120). */
  bankFeed: BankFeed;
  /** Advances being recovered (118). */
  advanceRecoveries: AdvanceRecovery[];
  /** Retentions whose installation has cleared QC and handover, with nothing open on the order, and that are still held (118). */
  retentionsReady: { retentionId: string; poCode: string; supplierName: string; amount: number; readyAt: string }[];
  /** The last closed months with tax activity, and whether each was handed to the accountant (116). */
  gstPeriods: { period: string; handedOver: boolean; handedOverAt?: string }[];
  /** Trading suppliers with a GSTIN, and when their GST standing was last looked at (116). */
  gstStatusChecks: { supplierId: string; name: string; lastCheckedAt: string | null; since: string }[];
  /** Deals where someone paused payment reminders by hand (083). */
  pausedDealIds: Set<string>;
}

export type ObligationState = 'open' | 'done' | 'cancelled';

export interface Obligation {
  key: string;
  kind: CommitmentKind;
  ownerUserId: string;
  subject: { type: CommitmentSubjectType; id: string };
  titleKey: string;
  titleParams: Record<string, string>;
  amount?: number;
  dueAt: string;
  state: ObligationState;
  paused: boolean;
  /** Known only when the source record carries it; history without one is
   *  never back-filled into a commitment. */
  completedAt?: string;
  actionRoute: string;
  oversightRoute: string;
}

export type QuickAction = 'complete_task' | 'acknowledge_po';

export interface CommitmentRule {
  kind: CommitmentKind;
  /** How long before due the owner gets a heads-up. */
  nudgeBefore: number;
  /** How long past due before the owner's manager hears about it — and
   *  twice this before it becomes an Alert. */
  escalateAfter: number;
  /** Whether anyone above the owner is chased at all. A customer's own
   *  instalment isn't escalated — the internal `payment_collect` is. */
  escalates: boolean;
  /** Whether a long-stuck one becomes an Alert for Admin. False where a
   *  dedicated escalation surface already exists (089 for payments) or the
   *  subject already *is* an Alert. */
  raisesAlert: boolean;
  alertCategory: Alert['category'];
  /** Proof of done that's simply the owner's say-so, offered one tap away
   *  in the assistant. Everything else is done by acting on its screen. */
  quickAction?: QuickAction;
  collect(src: CommitmentSources): Obligation[];
}

/* ---------------------------------------------------------------- helpers */

const iso = (ms: number) => new Date(ms).toISOString();
const plus = (at: string, ms: number) => iso(new Date(at).getTime() + ms);

/** Parts ordered for a deal that was later lost or cancelled (106): nobody is waiting for
 *  them any more, so nobody is chased about delivery. What to do with them is its own decision. */
function isOrphaned(src: CommitmentSources, po: SupplierPurchaseOrder): boolean {
  const deal = src.deals.find((d) => d.id === po.dealId);
  // A deal with no record at all is history from before deals were kept here, not a cancellation.
  return !!deal && (deal.status === 'lost' || deal.status === 'cancelled');
}

function adminId(src: CommitmentSources): string {
  return src.users.find((u) => u.role === 'admin' && u.status === 'active')?.id ?? 'u-admin-1';
}

function activeUser(src: CommitmentSources, id: string | undefined): User | undefined {
  if (!id) return undefined;
  const user = src.users.find((u) => u.id === id);
  return user && user.status !== 'suspended' && user.status !== 'rejected' ? user : undefined;
}

/** A lead's current owner if they can still act, else Admin. */
function leadOwner(src: CommitmentSources, lead: Lead | undefined): User | undefined {
  return activeUser(src, lead?.surveyorId);
}

function supplierUser(src: CommitmentSources, supplierId: string | undefined): User | undefined {
  const supplier = src.suppliers.find((s) => s.id === supplierId);
  if (!supplier?.gstin) return undefined;
  return src.users.find((u) => u.role === 'supplier' && u.gstin === supplier.gstin && u.status === 'active');
}

/** Surveyors act from their own lead list; Admin from the record's screen. */
function routeFor(owner: User | undefined, adminRoute: string): string {
  switch (owner?.role) {
    case 'surveyor':
      return '/surveyor/leads';
    case 'technician':
      return '/technician';
    case 'supplier':
      return '/orders';
    case 'customer':
      return '/customer';
    default:
      return adminRoute;
  }
}

function base(kind: CommitmentKind, type: CommitmentSubjectType, id: string) {
  return { key: `${kind}:${id}`, kind, subject: { type, id } };
}

/** How soon a late delivery's customer is told, and why it is late: sooner when the installation is what is held up. Read by the rule below and by the SLA monitor (185). */
export const DELAY_ACTION_TARGET = { critical: hours(6), normal: hours(24) } as const;

const ALERT_ACK_WINDOW: Record<AlertSeverity, number> = {
  critical: minutes(15),
  high: hours(1),
  medium: hours(8),
  low: hours(24),
};

/* ------------------------------------------------------------------ rules */

export const COMMITMENT_RULES: CommitmentRule[] = [
  {
    kind: 'payment_due',
    nudgeBefore: days(3),
    escalateAfter: days(3),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const out: Obligation[] = [];
      for (const payment of src.payments) {
        const deal = src.deals.find((d) => d.id === payment.dealId);
        const customer = activeUser(src, deal?.customerId);
        if (!deal || !customer) continue;
        const lead = src.leads.find((l) => l.id === deal.leadId);
        const state: ObligationState =
          payment.status === 'paid' ? 'done' : payment.status === 'refunded' ? 'cancelled' : 'open';
        out.push({
          ...base('payment_due', 'payment', payment.id),
          ownerUserId: customer.id,
          titleKey: 'work.title.payment_due',
          titleParams: { code: payment.code, site: lead?.siteName ?? deal.code },
          amount: state === 'open' ? remainingBalance(payment) : payment.amount,
          dueAt: payment.dueDate,
          state,
          paused: payment.status === 'disputed',
          completedAt: payment.paidAt,
          actionRoute: `/customer/payments/${payment.id}/checkout`,
          oversightRoute: '/admin/analytics/collections',
        });
      }
      return out;
    },
  },
  {
    kind: 'payment_collect',
    nudgeBefore: days(1),
    escalateAfter: days(3),
    escalates: true,
    // 089's escalation queue is the one place overdue money is worked —
    // a second Alert per payment would just be noise beside it.
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const out: Obligation[] = [];
      for (const payment of src.payments) {
        const deal = src.deals.find((d) => d.id === payment.dealId);
        if (!deal) continue;
        const lead = src.leads.find((l) => l.id === deal.leadId);
        const owner = leadOwner(src, lead) ?? activeUser(src, adminId(src));
        if (!owner) continue;
        const state: ObligationState =
          payment.status === 'paid' ? 'done' : payment.status === 'refunded' ? 'cancelled' : 'open';
        out.push({
          ...base('payment_collect', 'payment', payment.id),
          ownerUserId: owner.id,
          titleKey: 'work.title.payment_collect',
          titleParams: { code: payment.code, name: lead?.contactName ?? '', site: lead?.siteName ?? deal.code },
          amount: state === 'open' ? remainingBalance(payment) : payment.amount,
          dueAt: payment.dueDate,
          state,
          paused: payment.status === 'disputed' || src.pausedDealIds.has(deal.id),
          completedAt: payment.paidAt,
          actionRoute: routeFor(owner, '/admin/analytics/collections'),
          oversightRoute: '/admin/analytics/collections/escalation',
        });
      }
      return out;
    },
  },
  {
    kind: 'job_assign',
    nudgeBefore: days(3),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      return src.jobs.map((job) => ({
        ...base('job_assign', 'job', job.id),
        ownerUserId: admin,
        titleKey: 'work.title.job_assign',
        titleParams: { code: job.code, site: job.siteName },
        // Two days' lead so the technician can actually plan the visit.
        dueAt: plus(job.scheduledFor, -days(2)),
        state: job.technicianId ? ('done' as const) : ('open' as const),
        paused: job.status === 'on_hold',
        // Best match (020) is where a job with nobody gets its technician.
        actionRoute: '/admin/routes',
        oversightRoute: '/admin/routes',
      }));
    },
  },
  {
    kind: 'job_start',
    nudgeBefore: hours(18),
    escalateAfter: hours(4),
    escalates: true,
    raisesAlert: true,
    alertCategory: 'sla_breach',
    collect(src) {
      const out: Obligation[] = [];
      for (const job of src.jobs) {
        const technician = activeUser(src, job.technicianId);
        if (!technician) continue;
        const notStarted = job.status === 'scheduled' || job.status === 'materials_pending' || job.status === 'on_hold';
        out.push({
          ...base('job_start', 'job', job.id),
          ownerUserId: technician.id,
          titleKey: 'work.title.job_start',
          titleParams: { code: job.code, site: job.siteName },
          dueAt: job.scheduledFor,
          state: notStarted ? 'open' : 'done',
          // Nobody can start a job whose materials haven't arrived, or one
          // someone deliberately put on hold — chasing either is unfair.
          paused: job.status === 'materials_pending' || job.status === 'on_hold',
          completedAt: job.startedAt,
          actionRoute: '/technician',
          oversightRoute: `/admin/tracking/technician/${technician.id}`,
        });
      }
      return out;
    },
  },
  {
    kind: 'po_send',
    nudgeBefore: hours(4),
    escalateAfter: hours(24),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      return src.purchaseOrders
        .filter((po) => po.lineItems && po.status !== 'triggered' && po.status !== 'failed')
        .map((po) => ({
          ...base('po_send', 'purchase_order', po.id),
          ownerUserId: admin,
          titleKey: 'work.title.po_send',
          titleParams: { code: po.code, supplier: src.suppliers.find((s) => s.id === po.supplierId)?.name ?? '' },
          dueAt: plus(po.triggeredAt, hours(24)),
          state: po.status === 'sent' ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: po.sentAt,
          actionRoute: `/admin/deals/${po.dealId}/purchase-orders`,
          oversightRoute: `/admin/deals/${po.dealId}/purchase-orders`,
        }));
    },
  },
  {
    kind: 'po_acknowledge',
    nudgeBefore: hours(6),
    escalateAfter: hours(24),
    escalates: true,
    raisesAlert: true,
    alertCategory: 'supplier',
    quickAction: 'acknowledge_po',
    collect(src) {
      const admin = adminId(src);
      return src.purchaseOrders
        .filter((po) => po.status === 'sent' && po.sentAt)
        .map((po) => {
          const supplier = src.suppliers.find((s) => s.id === po.supplierId);
          const portalUser = supplierUser(src, po.supplierId);
          return {
            ...base('po_acknowledge', 'purchase_order', po.id),
            // A supplier with their own login owns their promise; one without
            // is chased by Admin on the phone until they have one.
            ownerUserId: portalUser?.id ?? admin,
            titleKey: portalUser ? 'work.title.po_acknowledge' : 'work.title.po_acknowledge_proxy',
            titleParams: { code: po.code, supplier: supplier?.name ?? '' },
            dueAt: plus(po.sentAt!, hours(24)),
            state: po.acknowledgedAt ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: po.acknowledgedAt,
            actionRoute: portalUser ? `/orders?poId=${po.id}` : `/admin/deals/${po.dealId}/purchase-orders`,
            oversightRoute: `/admin/deals/${po.dealId}/purchase-orders`,
          };
        });
    },
  },
  {
    // 095: a supplier who goes quiet mid-order. Due the moment the order has
    // sat in its stage longer than *this supplier* usually takes (×1.5) —
    // their own pace, not one number for everyone. Moving the stage is a new
    // promise, so the ladder restarts. Once shipped, the supplier's part is
    // done; receipt is Admin's (po_delivery).
    kind: 'po_status_update',
    nudgeBefore: 0,
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: true,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      const out: Obligation[] = [];
      for (const po of src.purchaseOrders) {
        if (po.status !== 'sent' || !po.sentAt || !po.lineItems?.length || isOrphaned(src, po)) continue;
        const stage = poStageOf(po);
        if (stage === 'sent') continue; // po_acknowledge covers this stage
        const supplier = src.suppliers.find((s) => s.id === po.supplierId);
        const portalUser = supplierUser(src, po.supplierId);
        const enteredAt = poStageEnteredAt(po);
        const done = stage === 'shipped' || stage === 'delivered';
        const typical = done ? 0 : typicalStageDays(supplier, stage, src.purchaseOrders).days;
        out.push({
          ...base('po_status_update', 'purchase_order', po.id),
          ownerUserId: portalUser?.id ?? admin,
          titleKey: portalUser ? 'work.title.po_status_update' : 'work.title.po_status_update_proxy',
          titleParams: { code: po.code, supplier: supplier?.name ?? '' },
          dueAt: plus(enteredAt, days(typical * AT_RISK_RATIO)),
          state: done ? 'done' : 'open',
          paused: false,
          completedAt: done ? enteredAt : undefined,
          actionRoute: '/orders',
          oversightRoute: '/orders',
        });
      }
      return out;
    },
  },
  {
    // A sent PO with no promised delivery date is a promise with no date —
    // exactly what lets parts go missing without anyone noticing.
    kind: 'po_delivery_date',
    nudgeBefore: hours(12),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      return src.purchaseOrders
        .filter((po) => po.status === 'sent' && po.sentAt && !isOrphaned(src, po))
        .map((po) => ({
          ...base('po_delivery_date', 'purchase_order', po.id),
          ownerUserId: admin,
          titleKey: 'work.title.po_delivery_date',
          titleParams: { code: po.code, supplier: src.suppliers.find((s) => s.id === po.supplierId)?.name ?? '' },
          dueAt: plus(po.sentAt!, days(2)),
          state: promisedDeliveryOf(po) ? ('done' as const) : ('open' as const),
          paused: false,
          actionRoute: `/admin/deals/${po.dealId}/purchase-orders`,
          oversightRoute: `/admin/deals/${po.dealId}/purchase-orders`,
        }));
    },
  },
  {
    kind: 'po_delivery',
    nudgeBefore: days(2),
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      return src.purchaseOrders
        .filter((po) => po.status === 'sent' && promisedDeliveryOf(po) && !isOrphaned(src, po))
        .map((po) => ({
          ...base('po_delivery', 'purchase_order', po.id),
          ownerUserId: admin,
          titleKey: 'work.title.po_delivery',
          titleParams: { code: po.code, supplier: src.suppliers.find((s) => s.id === po.supplierId)?.name ?? '' },
          dueAt: promisedDeliveryOf(po)!,
          state: po.receivedAt ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: po.receivedAt,
          // Receipt is verified item by item on site (103), never just ticked.
          actionRoute: `/delivery-checklist?poId=${po.id}`,
          oversightRoute: `/admin/deals/${po.dealId}/purchase-orders`,
        }));
    },
  },
  {
    kind: 'quote_expiring',
    nudgeBefore: days(2),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'sla_breach',
    collect(src) {
      const out: Obligation[] = [];
      for (const quote of src.quotations) {
        if (!quote.validityDate || quote.status === 'draft') continue;
        const lead = src.leads.find((l) => l.id === quote.leadId);
        const owner = leadOwner(src, lead);
        const state: ObligationState =
          quote.status === 'accepted'
            ? 'done'
            : quote.status === 'sent' || quote.status === 'viewed'
              ? lead?.stage === 'lost'
                ? 'cancelled'
                : 'open'
              : 'cancelled';
        out.push({
          ...base('quote_expiring', 'quotation', quote.id),
          ownerUserId: owner?.id ?? adminId(src),
          titleKey: 'work.title.quote_expiring',
          titleParams: { code: quote.code, site: lead?.siteName ?? '' },
          amount: quote.cost.finalPrice,
          dueAt: quote.validityDate,
          state,
          paused: false,
          completedAt: quote.acceptedAt,
          actionRoute: routeFor(owner, `/admin/quotes/${quote.id}/preview`),
          oversightRoute: `/admin/leads/${quote.leadId}`,
        });
      }
      return out;
    },
  },
  {
    kind: 'terms_customer_confirm',
    nudgeBefore: hours(12),
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: true,
    alertCategory: 'sla_breach',
    collect(src) {
      const out: Obligation[] = [];
      for (const terms of src.dealTerms) {
        if (terms.status === 'draft') continue;
        const deal = src.deals.find((d) => d.id === terms.dealId);
        const lead = src.leads.find((l) => l.id === deal?.leadId);
        const owner = leadOwner(src, lead);
        out.push({
          ...base('terms_customer_confirm', 'deal_terms', terms.id),
          ownerUserId: owner?.id ?? adminId(src),
          titleKey: 'work.title.terms_customer_confirm',
          titleParams: { name: lead?.contactName ?? '', site: lead?.siteName ?? deal?.code ?? '' },
          amount: terms.finalAgreedPrice,
          dueAt: plus(terms.internalConfirmedAt ?? terms.updatedAt, days(2)),
          state: terms.bothPartyConfirmedFlag ? 'done' : 'open',
          paused: false,
          completedAt: terms.customerConfirmedAt,
          actionRoute: routeFor(owner, `/admin/deals/${terms.dealId}/terms`),
          oversightRoute: `/admin/deals/${terms.dealId}/terms`,
        });
      }
      return out;
    },
  },
  {
    kind: 'discount_decision',
    nudgeBefore: hours(2),
    escalateAfter: hours(8),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'sla_breach',
    collect(src) {
      return src.discountRequests.map((request) => {
        const quote = src.quotations.find((q) => q.id === request.quotationId);
        return {
          ...base('discount_decision', 'discount_request', request.id),
          ownerUserId: activeUser(src, request.approverId)?.id ?? adminId(src),
          titleKey: 'work.title.discount_decision',
          titleParams: { pct: String(request.requestedDiscountPct), code: quote?.code ?? '' },
          // A surveyor standing in front of a customer can't wait a day.
          dueAt: plus(request.createdAt, request.urgent ? hours(4) : hours(24)),
          state: request.status === 'pending' ? ('open' as const) : ('done' as const),
          paused: false,
          completedAt: request.decidedAt,
          actionRoute: '/admin/quotes/discounts',
          oversightRoute: '/admin/quotes/discounts',
        };
      });
    },
  },
  {
    kind: 'counter_offer_decision',
    nudgeBefore: hours(1),
    escalateAfter: hours(4),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'sla_breach',
    collect(src) {
      return src.counterOffers.map((offer) => {
        const lead = src.leads.find((l) => l.id === offer.leadId);
        return {
          ...base('counter_offer_decision', 'counter_offer', offer.id),
          ownerUserId: activeUser(src, offer.approverId)?.id ?? adminId(src),
          titleKey: 'work.title.counter_offer_decision',
          titleParams: { site: lead?.siteName ?? '' },
          amount: offer.customerRequestedPrice,
          // A live negotiation goes cold in hours, not days.
          dueAt: plus(offer.createdAt, hours(4)),
          state:
            offer.status === 'pending'
              ? ('open' as const)
              : offer.status === 'superseded'
                ? ('cancelled' as const)
                : ('done' as const),
          paused: false,
          completedAt: offer.decidedAt,
          actionRoute: '/admin/deals/counter-offers',
          oversightRoute: '/admin/deals/counter-offers',
        };
      });
    },
  },
  {
    // A supplier's price change held for review (093). While it waits, new
    // POs keep drafting at the old price — fine for a day, stale after that.
    kind: 'catalog_price_review',
    nudgeBefore: hours(4),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      return src.catalogPriceChanges
        .filter((change) => change.source !== 'admin')
        .map((change) => ({
          ...base('catalog_price_review', 'catalog_price_change', change.id),
          ownerUserId: admin,
          titleKey: 'work.title.catalog_price_review',
          titleParams: { supplier: src.suppliers.find((s) => s.id === change.supplierId)?.name ?? '' },
          amount: change.toPrice,
          dueAt: plus(change.requestedAt, days(1)),
          state:
            change.status === 'pending'
              ? ('open' as const)
              : change.status === 'superseded'
                ? ('cancelled' as const)
                : ('done' as const),
          paused: false,
          completedAt: change.reviewedAt,
          actionRoute: '/catalog?view=review',
          oversightRoute: '/catalog?view=review',
        }));
    },
  },
  {
    // 097: a supplier's challenge to a rating is a fairness question — it
    // shouldn't sit unanswered while the rating keeps counting against them.
    kind: 'rating_dispute_review',
    nudgeBefore: days(1),
    escalateAfter: days(3),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      return src.orderRatings
        .filter((r) => r.dispute)
        .map((r) => ({
          ...base('rating_dispute_review', 'supplier_order_rating', r.id),
          ownerUserId: admin,
          titleKey: 'work.title.rating_dispute_review',
          titleParams: { code: r.orderCode, supplier: src.suppliers.find((s) => s.id === r.supplierId)?.name ?? '' },
          dueAt: plus(r.dispute!.raisedAt, days(3)),
          state: r.dispute!.status === 'open' ? ('open' as const) : ('done' as const),
          paused: false,
          completedAt: r.dispute!.resolvedAt,
          actionRoute: `/scorecard?supplierId=${r.supplierId}&rating=${r.id}`,
          oversightRoute: `/scorecard?supplierId=${r.supplierId}&rating=${r.id}`,
        }));
    },
  },
  {
    // A lapsed agreement blocks every new PO to that supplier (098), so
    // renewal is chased well before expiry, not discovered at send time.
    kind: 'supplier_agreement_renewal',
    nudgeBefore: RENEWAL_NOTICE,
    escalateAfter: days(3),
    escalates: true,
    raisesAlert: true,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      const out: Obligation[] = [];
      for (const supplier of src.suppliers) {
        if (supplier.status !== 'active') continue;
        const state = agreementState(versionsOf(src.agreementVersions, supplier.id), src.now);
        if (!state.current) continue;
        out.push({
          // One per version in force, so a renewal closes this one and the
          // next expiry starts a fresh commitment.
          ...base('supplier_agreement_renewal', 'supplier_agreement', state.current.id),
          ownerUserId: admin,
          titleKey: state.status === 'lapsed' ? 'work.title.supplier_agreement_lapsed' : 'work.title.supplier_agreement_renewal',
          titleParams: { supplier: supplier.name },
          dueAt: state.current.expiresOn,
          state: state.renewalOnFile ? 'done' : 'open',
          paused: false,
          completedAt: state.renewalOnFile ? state.upcoming?.recordedAt : undefined,
          actionRoute: `/agreement?supplierId=${supplier.id}`,
          oversightRoute: `/agreement?supplierId=${supplier.id}`,
        });
      }
      return out;
    },
  },
  {
    kind: 'supplier_agreement_acknowledge',
    nudgeBefore: days(1),
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      return src.agreementVersions.map((v) => {
        const supplier = src.suppliers.find((s) => s.id === v.supplierId);
        const portalUser = supplierUser(src, v.supplierId);
        return {
          ...base('supplier_agreement_acknowledge', 'supplier_agreement', v.id),
          // No portal login means Admin gets the confirmation in writing instead.
          ownerUserId: portalUser?.id ?? admin,
          titleKey: portalUser ? 'work.title.supplier_agreement_acknowledge' : 'work.title.supplier_agreement_acknowledge_proxy',
          titleParams: { supplier: supplier?.name ?? '', version: String(v.version) },
          dueAt: plus(v.recordedAt, days(3)),
          state: v.acknowledgedAt ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: v.acknowledgedAt,
          actionRoute: portalUser ? '/agreement' : `/agreement?supplierId=${v.supplierId}`,
          oversightRoute: `/agreement?supplierId=${v.supplierId}`,
        };
      });
    },
  },
  {
    // Every supplier message that asks for an answer is a promise one side
    // owes the other. An unanswered supplier is chased, then flagged to
    // Admin and — if it drags on — becomes an Alert, before it quietly
    // turns into a late delivery.
    kind: 'supplier_thread_reply',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: true,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      const out: Obligation[] = [];
      for (const thread of src.supplierThreads) {
        const messages = src.supplierMessages.filter((m) => m.threadId === thread.id).sort(byAt);
        const supplier = src.suppliers.find((s) => s.id === thread.supplierId);
        const portalUser = supplierUser(src, thread.supplierId);
        const code = thread.relatedPoId ? (src.purchaseOrders.find((p) => p.id === thread.relatedPoId)?.code ?? '') : '';
        messages.forEach((m, i) => {
          if (!m.expectsReply) return;
          const later = messages.slice(i + 1);
          const answer = later.find((l) => l.author !== m.author);
          // A follow-up from the same side supersedes this ask with a newer one.
          const superseded = !answer && later.some((l) => l.author === m.author);
          const toSupplier = m.author === 'aiec';
          const route = `/supplier-messages?thread=${thread.id}`;
          out.push({
            ...base('supplier_thread_reply', 'supplier_thread', m.id),
            ownerUserId: toSupplier ? (portalUser?.id ?? admin) : admin,
            titleKey: !toSupplier
              ? 'work.title.supplier_thread_answer'
              : portalUser
                ? 'work.title.supplier_thread_reply'
                : 'work.title.supplier_thread_reply_proxy',
            titleParams: { supplier: supplier?.name ?? '', code },
            dueAt: plus(m.at, m.urgent ? hours(4) : SUPPLIER_REPLY_WINDOW),
            state: answer ? 'done' : superseded ? 'cancelled' : 'open',
            paused: false,
            completedAt: answer?.at,
            actionRoute: route,
            oversightRoute: route,
          });
        });
      }
      return out;
    },
  },
  {
    // A retention is the supplier's money: it must end released or withheld
    // for a stated reason, never sit forgotten. The heartbeat releases most at
    // handover; Admin owns the ones it can't — a supplier defect paused it,
    // or no handover has come long after delivery.
    kind: 'supplier_retention_decision',
    nudgeBefore: days(1),
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      return src.supplierRetentions.map((r) => {
        const po = src.purchaseOrders.find((p) => p.id === r.poId);
        const paused = r.status === 'paused';
        return {
          ...base('supplier_retention_decision', 'supplier_retention', r.id),
          ownerUserId: admin,
          titleKey: paused ? 'work.title.supplier_retention_paused' : 'work.title.supplier_retention_review',
          titleParams: { code: po?.code ?? '', supplier: src.suppliers.find((s) => s.id === r.supplierId)?.name ?? '' },
          amount: r.amount,
          dueAt: paused && r.pausedAt ? plus(r.pausedAt, RETENTION_DECISION_WINDOW) : plus(r.heldAt, RETENTION_REVIEW_AFTER),
          state: r.status === 'released' || r.status === 'withheld' ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: r.decidedAt,
          actionRoute: '/admin/suppliers/payment-terms',
          oversightRoute: '/admin/suppliers/payment-terms',
        };
      });
    },
  },
  {
    // A sent PO with no booked delivery is parts with nowhere to go. Admin
    // owns getting it booked — early enough that the site and the supplier
    // can both plan for it — and again if a truck turned up at a site that
    // wasn't ready.
    kind: 'delivery_schedule',
    nudgeBefore: days(2),
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      const out: Obligation[] = [];
      for (const po of src.purchaseOrders) {
        if (po.status !== 'sent' || !po.sentAt || !po.supplierId || isOrphaned(src, po)) continue;
        const schedule = src.deliverySchedules.find((s) => s.poId === po.id);
        const booked = schedule?.status === 'scheduled';
        const failedAt = schedule?.status === 'attempt_failed' ? [...schedule.events].reverse().find((e) => e.kind === 'attempt_failed')?.at : undefined;
        const bookedAt = schedule ? [...schedule.events].reverse().find((e) => e.kind === 'scheduled' || e.kind === 'rescheduled')?.at : undefined;
        const promised = promisedDeliveryOf(po);
        out.push({
          ...base('delivery_schedule', 'delivery', po.id),
          ownerUserId: admin,
          titleKey: failedAt ? 'work.title.delivery_rebook' : 'work.title.delivery_schedule',
          titleParams: { code: po.code, supplier: src.suppliers.find((s) => s.id === po.supplierId)?.name ?? '' },
          dueAt: failedAt ? plus(failedAt, days(2)) : promised ? plus(promised, -days(10)) : plus(po.sentAt, days(14)),
          state: booked || po.receivedAt ? 'done' : 'open',
          paused: false,
          completedAt: booked ? bookedAt : po.receivedAt,
          actionRoute: `/deliveries?poId=${po.id}`,
          oversightRoute: `/deliveries?poId=${po.id}`,
        });
      }
      return out;
    },
  },
  {
    // The booked delivery is the technician's to receive — or Admin's while
    // the job has nobody on it. Due when the booked window closes.
    kind: 'delivery_receive',
    nudgeBefore: hours(18),
    escalateAfter: hours(4),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      const out: Obligation[] = [];
      for (const s of src.deliverySchedules) {
        if (s.status !== 'scheduled' || !s.date || !s.window) continue;
        const po = src.purchaseOrders.find((p) => p.id === s.poId);
        if (!po) continue;
        const job = (s.jobId ? src.jobs.find((j) => j.id === s.jobId) : undefined) ?? src.jobs.find((j) => j.dealId === s.dealId && !j.startedAt && (j.status === 'materials_pending' || j.status === 'scheduled'));
        const technician = activeUser(src, job?.technicianId);
        const deal = src.deals.find((d) => d.id === s.dealId);
        const site = src.leads.find((l) => l.id === deal?.leadId)?.siteName ?? '';
        out.push({
          ...base('delivery_receive', 'delivery', po.id),
          ownerUserId: technician?.id ?? admin,
          titleKey: 'work.title.delivery_receive',
          titleParams: { code: po.code, site },
          dueAt: windowEndsAt(s.date, s.window),
          state: po.receivedAt ? 'done' : 'open',
          paused: false,
          completedAt: po.receivedAt,
          actionRoute: `/delivery-checklist?poId=${po.id}`,
          oversightRoute: `/deliveries?poId=${po.id}`,
        });
      }
      return out;
    },
  },
  {
    // Parts already ordered for a deal that then fell through (106). Someone has to decide
    // where they go, or back they go, before the supplier finishes and ships them.
    kind: 'orphaned_po_decision',
    nudgeBefore: hours(12),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      const out: Obligation[] = [];
      for (const po of src.purchaseOrders) {
        if (po.status !== 'sent' || !po.lineItems?.length || !isOrphaned(src, po)) continue;
        const deal = src.deals.find((d) => d.id === po.dealId);
        out.push({
          ...base('orphaned_po_decision', 'purchase_order', po.id),
          ownerUserId: admin,
          titleKey: 'work.title.orphaned_po_decision',
          titleParams: { code: po.code, supplier: src.suppliers.find((sp) => sp.id === po.supplierId)?.name ?? '' },
          dueAt: plus(deal?.closedAt ?? po.sentAt ?? new Date(src.now).toISOString(), days(2)),
          state: po.orphanResolution || po.receivedAt ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: po.orphanResolution?.decidedAt,
          actionRoute: '/stock-in-transit?tab=attention',
          oversightRoute: '/stock-in-transit?tab=attention',
        });
      }
      return out;
    },
  },
  {
    // A delivery that has gone past what we promised is Admin's to run down: tell the
    // customer honestly, and say why it is late. Once both are done, or it has caught up,
    // there is nothing left to chase.
    kind: 'delivery_delay_action',
    nudgeBefore: hours(1),
    escalateAfter: hours(6),
    escalates: true,
    // The delay already raised its own alert; escalating would raise a second for the same thing.
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      const out: Obligation[] = [];
      for (const c of src.delayCases) {
        // A watch is not yet a promise broken.
        if (!c.lateSince) continue;
        const po = src.purchaseOrders.find((p) => p.id === c.poId);
        const deal = src.deals.find((d) => d.id === c.dealId);
        const site = src.leads.find((l) => l.id === deal?.leadId)?.siteName ?? '';
        out.push({
          ...base('delivery_delay_action', 'delivery', c.id),
          ownerUserId: admin,
          titleKey: 'work.title.delivery_delay_action',
          titleParams: { code: po?.code ?? '', site },
          // Sooner when the install is what is being held up.
          dueAt: plus(c.lateSince, c.worstSeverity === 'critical' ? DELAY_ACTION_TARGET.critical : DELAY_ACTION_TARGET.normal),
          state: c.status === 'recovered' || (c.customerNotifiedAt && c.rootCause) ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: c.recoveredAt ?? c.customerNotifiedAt,
          actionRoute: `/delivery-delays?case=${c.id}`,
          oversightRoute: `/delivery-delays?case=${c.id}`,
        });
      }
      return out;
    },
  },
  {
    // A checked delivery is only formal once it is signed (104). Whoever
    // received it owns that, Admin when nobody with a login did.
    kind: 'delivery_confirmation_sign',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      return src.deliveryConfirmations.map((c) => {
        const po = src.purchaseOrders.find((p) => p.id === c.poId);
        const checklist = src.deliveryChecklists.find((k) => k.id === c.checklistId);
        const receiver = activeUser(src, checklist?.completedByUserId);
        const deal = src.deals.find((d) => d.id === c.dealId);
        const site = src.leads.find((l) => l.id === deal?.leadId)?.siteName ?? '';
        return {
          ...base('delivery_confirmation_sign', 'delivery', c.id),
          ownerUserId: receiver && receiver.role === 'technician' ? receiver.id : admin,
          titleKey: 'work.title.delivery_confirmation_sign',
          titleParams: { code: po?.code ?? '', site },
          dueAt: plus(c.createdAt, hours(24)),
          state: c.status === 'signed' ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: c.signedAt,
          actionRoute: `/delivery-confirmation?confirmation=${c.id}`,
          oversightRoute: `/delivery-confirmation?confirmation=${c.id}`,
        };
      });
    },
  },
  {
    // Someone who arrived on site and has not said they left, past a working day, has forgotten (125). They are prompted the next time
    // they open the app; if they still have not, Admin hears, so "still checked in" never quietly distorts the on-site time.
    kind: 'site_checkout_confirm',
    nudgeBefore: hours(1),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      // Only visits that were ever forgotten: an ordinary check-out is not an obligation, and history is not chased.
      return src.siteCheckIns
        .filter((v) => !v.checkOutAt || v.checkOutKind === 'confirmed_late')
        .map((v) => {
          const job = src.jobs.find((j) => j.id === v.jobId);
          const owner = activeUser(src, v.userId);
          return {
            ...base('site_checkout_confirm', 'site_checkin', v.id),
            ownerUserId: owner ? owner.id : admin,
            titleKey: 'work.title.site_checkout_confirm',
            titleParams: { code: job?.code ?? '', site: job?.siteName ?? '' },
            dueAt: plus(v.checkInAt, STALE_AFTER),
            state: v.checkOutAt ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: v.closedAt ?? v.checkOutAt,
            actionRoute: `/technician/jobs/${v.jobId}/checkin`,
            oversightRoute: `/admin/tracking/technician/${v.userId}`,
          };
        });
    },
  },
  {
    // A safety check that needs Admin (a fundamental fault, repeated failures, or a technician who disagrees with how it is tested) is
    // reviewed within a day: the job cannot reach quality check until it is (126). Ordinary fail-fix-retest is the technician's own and
    // is not chased here.
    kind: 'safety_review',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'safety',
    collect(src) {
      const admin = adminId(src);
      return src.jobSafetyTests.flatMap((t) => {
        const job = src.jobs.find((j) => j.id === t.jobId);
        const hold = t.holds.find((h) => !h.releasedAt);
        const heldAt = t.holds.length ? t.holds[t.holds.length - 1].at : undefined;
        const dis = t.disagreement;
        const openAt = hold ? hold.at : dis && !dis.resolution ? dis.at : undefined;
        // Only what ever needed review is a commitment: an ordinary test is not.
        if (!heldAt && !dis) return [];
        const doneAt = !openAt ? [t.holds[t.holds.length - 1]?.releasedAt, dis?.resolution?.at].filter(Boolean).sort().pop() : undefined;
        return [
          {
            ...base('safety_review', 'safety_test', t.id),
            ownerUserId: admin,
            titleKey: 'work.title.safety_review',
            titleParams: { code: job?.code ?? '', site: job?.siteName ?? '', item: t.itemId },
            dueAt: plus(openAt ?? heldAt ?? dis?.at ?? new Date(0).toISOString(), hours(24)),
            state: openAt ? ('open' as const) : ('done' as const),
            paused: false,
            completedAt: doneAt,
            actionRoute: `/safety-checklist/${t.jobId}`,
            oversightRoute: `/safety-checklist/${t.jobId}`,
          },
        ];
      });
    },
  },
  {
    // A problem that pauses work is Admin's to see through (127): a safety stop is chased in hours, a blocked job by the next day. The
    // alert is the beacon; this is who owns getting it resolved, and by when.
    kind: 'job_issue_resolve',
    nudgeBefore: hours(1),
    escalateAfter: hours(6),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.jobIssues
        .filter((i) => pausesWork(i.severity))
        .map((i) => {
          const job = src.jobs.find((j) => j.id === i.jobId);
          return {
            ...base('job_issue_resolve', 'job_issue', i.id),
            ownerUserId: admin,
            titleKey: 'work.title.job_issue_resolve',
            titleParams: { code: i.code, site: job?.siteName ?? '' },
            dueAt: plus(i.createdAt, RESOLVE_TARGET[i.severity as 'blocking' | 'safety']),
            state: i.status === 'resolved' ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: i.resolution?.at,
            actionRoute: `/job-issues/${i.jobId}?issue=${i.id}`,
            oversightRoute: `/job-issues/${i.jobId}?issue=${i.id}`,
          };
        });
    },
  },
  {
    // A finished installation waits for someone independent to check it (131): naming the inspector is Admin's, within a day of it being ready.
    kind: 'qc_assign',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.qcWaiting.map((w) => {
        const job = src.jobs.find((j) => j.id === w.jobId);
        return {
          ...base('qc_assign', 'job', w.jobId),
          ownerUserId: admin,
          titleKey: 'work.title.qc_assign',
          titleParams: { code: job?.code ?? '', site: job?.siteName ?? '' },
          dueAt: plus(w.readyAt, hours(24)),
          state: w.assigned ? ('done' as const) : ('open' as const),
          paused: false,
          actionRoute: `/qc-assignments/${w.jobId}`,
          oversightRoute: `/qc-assignments/${w.jobId}`,
        };
      });
    },
  },
  {
    // An inspector named but no time agreed with the customer: booking the visit is Admin's, within two days of naming them.
    kind: 'qc_schedule',
    nudgeBefore: hours(6),
    escalateAfter: hours(24),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.qcAssignments
        .filter((a) => a.status !== 'cancelled' && a.status !== 'completed' && a.inspectorId !== admin)
        .map((a) => {
          const job = src.jobs.find((j) => j.id === a.jobId);
          return {
            ...base('qc_schedule', 'qc_assignment', a.id),
            ownerUserId: admin,
            titleKey: 'work.title.qc_schedule',
            titleParams: { code: job?.code ?? '', name: a.inspectorName },
            dueAt: plus(a.assignedAt, hours(48)),
            state: a.scheduledDate || a.status === 'in_progress' ? ('done' as const) : ('open' as const),
            paused: false,
            actionRoute: `/qc-assignments/${a.jobId}`,
            oversightRoute: `/qc-assignments/${a.jobId}`,
          };
        });
    },
  },
  {
    // The inspector's own promise: the visit, at the time agreed (131). It is what lands in their inbox when they are named.
    kind: 'qc_visit',
    nudgeBefore: hours(12),
    escalateAfter: hours(6),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      return src.qcAssignments
        .filter((a) => a.status !== 'cancelled')
        .map((a) => {
          const job = src.jobs.find((j) => j.id === a.jobId);
          const end = a.scheduledDate ? new Date(`${a.scheduledDate}T00:00:00`).getTime() + (a.window === 'afternoon' ? 18 : 13) * 3_600_000 : new Date(a.assignedAt).getTime() + days(5);
          return {
            ...base('qc_visit', 'qc_assignment', a.id),
            ownerUserId: a.inspectorId,
            titleKey: a.scheduledDate ? 'work.title.qc_visit' : 'work.title.qc_visit_unscheduled',
            titleParams: { code: job?.code ?? '', site: job?.siteName ?? '', date: a.scheduledDate ?? '' },
            dueAt: new Date(end).toISOString(),
            state: a.status === 'in_progress' || a.status === 'completed' ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: a.status === 'completed' ? a.events[a.events.length - 1]?.at : undefined,
            actionRoute: `/qc-assignments/${a.jobId}`,
            oversightRoute: `/qc-assignments/${a.jobId}`,
          };
        });
    },
  },
  {
    // A pass with a noted exception is Admin's to accept or refuse (132), within a day; until then the check cannot be signed off.
    kind: 'qc_exception_review',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.qcMechChecks.flatMap((c) =>
        Object.entries(c.attempts).flatMap(([itemId, list]) => {
          const last = list?.[list.length - 1];
          if (!last || last.verdict !== 'exception') return [];
          const job = src.jobs.find((j) => j.id === c.jobId);
          return [
            {
              ...base('qc_exception_review', 'qc_attempt', `${c.jobId}:${itemId}:${last.n}`),
              ownerUserId: admin,
              titleKey: 'work.title.qc_exception_review',
              titleParams: { code: job?.code ?? '', item: itemId },
              dueAt: plus(last.at, hours(24)),
              state: last.review?.status === 'pending' ? ('open' as const) : ('done' as const),
              paused: false,
              completedAt: last.review?.at,
              actionRoute: `/qc-mechanical/${c.jobId}`,
              oversightRoute: `/qc-mechanical/${c.jobId}`,
            },
          ];
        }),
      );
    },
  },
  {
    // Both quality checks signed off means the compliance certificate is Admin's to issue (134), within a day: the customer's own
    // inspection application waits for it.
    kind: 'qc_certificate_issue',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.qcCertificateWaiting.map((w) => {
        const job = src.jobs.find((j) => j.id === w.jobId);
        return {
          ...base('qc_certificate_issue', 'job', w.jobId),
          ownerUserId: admin,
          titleKey: 'work.title.qc_certificate_issue',
          titleParams: { code: job?.code ?? '', site: job?.siteName ?? '' },
          dueAt: plus(w.readyAt, hours(24)),
          state: w.issued ? ('done' as const) : ('open' as const),
          paused: false,
          actionRoute: `/compliance/${w.jobId}`,
          oversightRoute: `/compliance/${w.jobId}`,
        };
      });
    },
  },
  {
    // A snag nobody has been named to fix waits on Admin (135): within hours for a safety-critical one, a day for a functional one.
    kind: 'snag_assign',
    nudgeBefore: hours(2),
    escalateAfter: hours(6),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.snags
        .filter((r) => !r.ownerId || r.status === 'open')
        .map((r) => {
          const job = src.jobs.find((j) => j.id === r.jobId);
          return {
            ...base('snag_assign', 'snag', r.id),
            ownerUserId: admin,
            titleKey: 'work.title.snag_assign',
            titleParams: { snag: r.code, job: job?.code ?? '', what: r.title ?? r.itemId },
            dueAt: plus(r.raisedAt, ASSIGN_DUE[r.severity]),
            state: r.status === 'open' && !r.ownerId ? ('open' as const) : ('done' as const),
            paused: false,
            actionRoute: `/rework/${r.id}`,
            oversightRoute: `/snags/${r.jobId}?snag=${r.id}`,
          };
        });
    },
  },
  {
    // The person named to put a snag right does it by the time set from its severity (135). Reporting it done hands it to QC, not to closed.
    kind: 'snag_rework',
    nudgeBefore: hours(2),
    escalateAfter: hours(6),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      return src.snags
        .filter((r) => !!r.ownerId && !!r.dueAt)
        .map((r) => {
          const job = src.jobs.find((j) => j.id === r.jobId);
          return {
            ...base('snag_rework', 'snag', r.id),
            ownerUserId: r.ownerId as string,
            titleKey: 'work.title.snag_rework',
            titleParams: { snag: r.code, job: job?.code ?? '', what: r.title ?? r.itemId },
            dueAt: r.dueAt as string,
            state: r.status === 'assigned' || r.status === 'in_progress' || r.status === 'open' ? ('open' as const) : ('done' as const),
            // A disagreement with the finding waits for Admin's decision, not the clock.
            paused: r.status === 'disputed',
            completedAt: r.fixedAt,
            actionRoute: `/rework/${r.id}`,
            oversightRoute: `/snags/${r.jobId}?snag=${r.id}`,
          };
        });
    },
  },
  {
    // A fix is not closed by the person who made it: QC re-confirms it (135), the inspector on the job or Admin.
    kind: 'snag_reverify',
    nudgeBefore: hours(2),
    escalateAfter: hours(6),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.snags
        .filter((r) => r.status === 'ready_for_retest' || r.verifiedAt || r.resolvedVia)
        .map((r) => {
          const job = src.jobs.find((j) => j.id === r.jobId);
          const inspector = src.qcAssignments.filter((a) => a.jobId === r.jobId && a.status !== 'cancelled').sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))[0];
          const readyAt = [...r.events].reverse().find((e) => e.kind === 'ready_for_retest' || e.kind === 'dispute_decided')?.at ?? r.fixedAt ?? r.raisedAt;
          return {
            ...base('snag_reverify', 'snag', r.id),
            ownerUserId: inspector?.inspectorId ?? admin,
            titleKey: 'work.title.snag_reverify',
            titleParams: { snag: r.code, job: job?.code ?? '', what: r.title ?? r.itemId },
            dueAt: plus(readyAt, REVERIFY_DUE[r.severity]),
            state: r.status === 'ready_for_retest' ? ('open' as const) : ('done' as const),
            paused: false,
            completedAt: r.verifiedAt,
            actionRoute: r.source === 'snag' ? `/snags/${r.jobId}?snag=${r.id}` : r.source === 'qc_electrical' ? `/qc-electrical/${r.jobId}` : `/qc-mechanical/${r.jobId}`,
            oversightRoute: `/snags/${r.jobId}?snag=${r.id}`,
          };
        });
    },
  },
  {
    // A technician's disagreement with a finding is Admin's to decide (135), so a standoff never sits.
    kind: 'snag_dispute_decide',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.snags
        .filter((r) => !!r.dispute)
        .map((r) => {
          const job = src.jobs.find((j) => j.id === r.jobId);
          return {
            ...base('snag_dispute_decide', 'snag', `${r.id}:${(r.dispute as NonNullable<typeof r.dispute>).at}`),
            ownerUserId: admin,
            titleKey: 'work.title.snag_dispute_decide',
            titleParams: { snag: r.code, job: job?.code ?? '', what: r.title ?? r.itemId },
            dueAt: plus((r.dispute as NonNullable<typeof r.dispute>).at, DISPUTE_DECIDE_DUE),
            state: r.status === 'disputed' ? ('open' as const) : ('done' as const),
            paused: false,
            completedAt: r.dispute?.decision?.at,
            actionRoute: `/snags/${r.jobId}?snag=${r.id}`,
            oversightRoute: `/snags/${r.jobId}?snag=${r.id}`,
          };
        });
    },
  },
  {
    // A part the fix needs that was not delivered becomes a small purchase order, raised by Admin within a day of the request (136).
    kind: 'snag_part_order',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.snags.flatMap((r) =>
        (r.rework?.parts ?? []).map((p) => {
          const job = src.jobs.find((j) => j.id === r.jobId);
          return {
            ...base('snag_part_order', 'snag', `${r.id}:${p.id}`),
            ownerUserId: admin,
            titleKey: 'work.title.snag_part_order',
            titleParams: { snag: r.code, job: job?.code ?? '', what: p.description },
            dueAt: plus(p.requestedAt, hours(24)),
            state: p.poId ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: p.orderedAt,
            actionRoute: `/rework/${r.id}`,
            oversightRoute: `/rework/${r.id}`,
          };
        }),
      );
    },
  },
  {
    // Everything is in place, so someone says Ready for Handover (137) within a day: the customer's walkthrough waits for it.
    kind: 'handover_confirm',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.handoverWaiting.map((w) => {
        const job = src.jobs.find((j) => j.id === w.jobId);
        return {
          ...base('handover_confirm', 'job', w.jobId),
          ownerUserId: w.ownerId ?? admin,
          titleKey: 'work.title.handover_confirm',
          titleParams: { code: job?.code ?? '', site: job?.siteName ?? '' },
          dueAt: plus(w.readyAt, hours(24)),
          state: w.confirmed ? ('done' as const) : ('open' as const),
          paused: false,
          actionRoute: `/handover-checklist/${w.jobId}`,
          oversightRoute: `/handover-checklist/${w.jobId}`,
        };
      });
    },
  },
  {
    // An extra review Admin asked of themself before a particular handover (137).
    kind: 'handover_admin_review',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.handoverReviews.map((r) => {
        const job = src.jobs.find((j) => j.id === r.jobId);
        return {
          ...base('handover_admin_review', 'job', r.jobId),
          ownerUserId: admin,
          titleKey: 'work.title.handover_admin_review',
          titleParams: { code: job?.code ?? '', site: job?.siteName ?? '' },
          dueAt: plus(r.addedAt, hours(24)),
          state: r.done ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: r.doneAt,
          actionRoute: `/handover-checklist/${r.jobId}`,
          oversightRoute: `/handover-checklist/${r.jobId}`,
        };
      });
    },
  },
  {
    // Once a job is ready for handover someone arranges the customer walkthrough within two days (138).
    kind: 'walkthrough_arrange',
    nudgeBefore: hours(6),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.walkthroughs.map((x) => {
        const job = src.jobs.find((j) => j.id === x.jobId);
        return {
          ...base('walkthrough_arrange', 'job', x.jobId),
          ownerUserId: x.leadId ?? admin,
          titleKey: 'work.title.walkthrough_arrange',
          titleParams: { code: job?.code ?? '', site: job?.siteName ?? '' },
          dueAt: plus(x.unlockedAt, ARRANGE_DUE),
          state: x.w.mode && x.w.conductorId ? ('done' as const) : ('open' as const),
          paused: false,
          actionRoute: `/handover-walkthrough/${x.jobId}`,
          oversightRoute: `/handover-walkthrough/${x.jobId}`,
        };
      });
    },
  },
  {
    // The person named to conduct the walkthrough does it on the day agreed (138): the most human step of the whole job.
    kind: 'walkthrough_conduct',
    nudgeBefore: hours(12),
    escalateAfter: hours(6),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      return src.walkthroughs
        .filter((x) => x.w.mode && x.w.conductorId)
        .map((x) => {
          const job = src.jobs.find((j) => j.id === x.jobId);
          const end = x.w.scheduledFor ? new Date(`${x.w.scheduledFor.date}T00:00:00`).getTime() + (x.w.scheduledFor.window === 'afternoon' ? 18 : 13) * 3_600_000 : new Date(x.unlockedAt).getTime() + 7 * 86_400_000;
          return {
            ...base('walkthrough_conduct', 'job', x.jobId),
            ownerUserId: x.w.conductorId as string,
            titleKey: 'work.title.walkthrough_conduct',
            titleParams: { code: job?.code ?? '', site: job?.siteName ?? '' },
            dueAt: new Date(end).toISOString(),
            state: x.w.conducted ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: x.w.conducted?.at,
            actionRoute: `/handover-walkthrough/${x.jobId}`,
            oversightRoute: `/handover-walkthrough/${x.jobId}`,
          };
        });
    },
  },
  {
    // The customer's own sign-off follows the walkthrough (138): a day if they were there, three if they were not. It is theirs to give, and it escalates to Admin.
    kind: 'walkthrough_signoff',
    nudgeBefore: hours(12),
    escalateAfter: hours(24),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.walkthroughs
        .filter((x) => !!x.w.conducted)
        .map((x) => {
          const job = src.jobs.find((j) => j.id === x.jobId);
          const at = (x.w.conducted as NonNullable<typeof x.w.conducted>).at;
          return {
            ...base('walkthrough_signoff', 'job', x.jobId),
            ownerUserId: x.customerId ?? admin,
            titleKey: 'work.title.walkthrough_signoff',
            titleParams: { code: job?.code ?? '', site: job?.siteName ?? '' },
            dueAt: plus(at, x.w.mode === 'in_person' ? SIGNOFF_DUE_PRESENT : SIGNOFF_DUE_REMOTE),
            state: x.w.signoff ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: x.w.signoff?.at,
            actionRoute: `/handover-walkthrough/${x.jobId}`,
            oversightRoute: `/handover-walkthrough/${x.jobId}`,
          };
        });
    },
  },
  {
    // A question the customer raised beyond the script goes to Admin to answer within a day (138), so the conductor never has to know everything on the spot.
    kind: 'walkthrough_followup',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.walkthroughs.flatMap((x) =>
        x.w.followUps.map((q) => {
          const job = src.jobs.find((j) => j.id === x.jobId);
          return {
            ...base('walkthrough_followup', 'job', `${x.jobId}:${q.id}`),
            ownerUserId: admin,
            titleKey: 'work.title.walkthrough_followup',
            titleParams: { code: job?.code ?? '', site: job?.siteName ?? '' },
            dueAt: plus(q.at, FOLLOWUP_DUE),
            state: q.answer ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: q.answer?.at,
            actionRoute: `/handover-walkthrough/${x.jobId}`,
            oversightRoute: `/handover-walkthrough/${x.jobId}`,
          };
        }),
      );
    },
  },
  {
    // Once the handover walkthrough is done the warranty starts, and Admin makes sure it is registered within two days (139).
    kind: 'warranty_register',
    nudgeBefore: hours(6),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.walkthroughs
        .filter((x) => !!x.w.conducted)
        .map((x) => {
          const job = src.jobs.find((j) => j.id === x.jobId);
          const registered = src.warranties.find((w) => w.jobId === x.jobId);
          return {
            ...base('warranty_register', 'job', x.jobId),
            ownerUserId: admin,
            titleKey: 'work.title.warranty_register',
            titleParams: { code: job?.code ?? '', site: job?.siteName ?? '' },
            dueAt: plus((x.w.conducted as NonNullable<typeof x.w.conducted>).at, hours(48)),
            state: registered ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: registered?.registeredAt,
            actionRoute: `/warranty/${x.jobId}`,
            oversightRoute: `/warranty/${x.jobId}`,
          };
        });
    },
  },
  {
    // Everything the completion certificate needs is in place: Admin issues it, which closes the project and triggers every final payout (140).
    kind: 'handover_certificate_issue',
    nudgeBefore: hours(12),
    escalateAfter: hours(24),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.completions.map((x) => {
        const job = src.jobs.find((j) => j.id === x.jobId);
        return {
          ...base('handover_certificate_issue', 'job', x.jobId),
          ownerUserId: admin,
          titleKey: 'work.title.handover_certificate_issue',
          titleParams: { code: job?.code ?? '', site: job?.siteName ?? '' },
          dueAt: plus(x.readyAt, hours(48)),
          state: x.issued ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: x.issuedAt,
          actionRoute: `/handover-certificate/${x.jobId}`,
          oversightRoute: `/handover-certificate/${x.jobId}`,
        };
      });
    },
  },
  {
    // Whoever an applicant named as a reference is called within three days of the application (142). An unreachable one is an outcome, not a block.
    kind: 'application_reference_check',
    nudgeBefore: hours(12),
    escalateAfter: hours(48),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      return src.applications
        .filter((a) => a.status === 'submitted' && a.submittedAt && a.form.references.length > 0)
        .map((a) => {
          const open = a.form.references.filter((r) => !r.outcome);
          const done = a.form.references.every((r) => !!r.outcome);
          return {
            ...base('application_reference_check', 'application', a.id),
            ownerUserId: admin,
            titleKey: 'work.title.application_reference_check',
            titleParams: { name: a.form.personal.fullName, count: String(open.length) },
            dueAt: plus(a.submittedAt as string, days(3)),
            state: done ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: done ? a.form.references.map((r) => r.outcome?.at ?? '').sort().pop() : undefined,
            actionRoute: `/applications/${a.id}`,
            oversightRoute: `/applications/${a.id}`,
          };
        });
    },
  },
  {
    // Someone who applied through 005 / 006 / 007 waits in 004's queue for Admin's yes or no; a person left waiting is a partner lost.
    // Applications older than 30 days with no decision are history, not chased.
    kind: 'onboarding_review',
    nudgeBefore: hours(12),
    escalateAfter: hours(24),
    escalates: true,
    raisesAlert: true,
    alertCategory: 'staffing',
    collect(src) {
      return src.users
        .filter((u) => u.status === 'pending_approval' && u.role !== 'admin' && u.role !== 'customer' && u.joinedAt && src.now - Date.parse(u.joinedAt) < days(30))
        // A supplier is decided by its KYC review in the directory (091); once that is decided this is no longer owed.
        .filter((u) => u.role !== 'supplier' || src.suppliers.some((sp) => sp.gstin && sp.gstin === u.gstin && sp.kycStatus === 'pending'))
        .map((u) => ({
          ...base('onboarding_review', 'application', `user:${u.id}`),
          ownerUserId: adminId(src),
          titleKey: 'work.title.onboarding_review',
          titleParams: { name: u.name, role: u.role },
          dueAt: plus(u.joinedAt as string, days(2)),
          state: 'open' as const,
          paused: false,
          actionRoute: u.role === 'supplier' ? '/admin/suppliers' : '/onboarding/role',
          oversightRoute: u.role === 'supplier' ? '/admin/suppliers' : '/onboarding/role',
        }));
    },
  },
  {
    // Submitted applications wait for a first look (143). One promise for the whole queue, so a surge is one line to act on, not sixty; it is due
    // when the oldest one has waited the screening window, and it moves as the oldest are cleared.
    kind: 'application_screening',
    nudgeBefore: hours(12),
    escalateAfter: hours(24),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const waiting = src.applications.filter((a) => a.status === 'submitted' && a.submittedAt).sort((a, b) => (a.submittedAt as string).localeCompare(b.submittedAt as string));
      if (waiting.length === 0) return [];
      return [
        {
          ...base('application_screening', 'application', 'queue'),
          ownerUserId: adminId(src),
          titleKey: 'work.title.application_screening',
          titleParams: { count: String(waiting.length) },
          dueAt: plus(waiting[0].submittedAt as string, SCREEN_DUE),
          state: 'open' as const,
          paused: false,
          actionRoute: '/screening',
          oversightRoute: '/screening',
        },
      ];
    },
  },
  {
    // An approved applicant has no way forward until Admin decides: interview first, or straight to the offer (144). History is not chased.
    kind: 'interview_arrange',
    nudgeBefore: hours(12),
    escalateAfter: hours(48),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      return src.applications
        .filter((a) => a.status === 'approved' && a.screening?.decision && Date.now() - new Date(a.screening.decision.at).getTime() < INTERVIEW_ARRANGE_DUE * 10)
        .map((a) => {
          const arranged = !!a.interview && a.interview.status !== 'cancelled';
          return {
            ...base('interview_arrange', 'application', a.id),
            ownerUserId: admin,
            titleKey: 'work.title.interview_arrange',
            titleParams: { name: a.form.personal.fullName },
            dueAt: plus((a.screening as NonNullable<typeof a.screening>).decision!.at, INTERVIEW_ARRANGE_DUE),
            state: arranged ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: arranged ? (a.interview?.skipped?.at ?? a.interview?.invitedAt) : undefined,
            actionRoute: `/interviews/${a.id}`,
            oversightRoute: `/interviews/${a.id}`,
          };
        });
    },
  },
  {
    // An invitation the applicant has not answered: Admin follows up (the automatic nudge goes out once at the same moment) (144).
    kind: 'interview_slot_wait',
    nudgeBefore: hours(6),
    escalateAfter: hours(48),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      return src.applications
        .filter((a) => a.status === 'approved' && a.interview?.status === 'invited')
        .map((a) => ({
          ...base('interview_slot_wait', 'application', a.id),
          ownerUserId: admin,
          titleKey: 'work.title.interview_slot_wait',
          titleParams: { name: a.form.personal.fullName },
          dueAt: plus((a.interview as NonNullable<typeof a.interview>).invitedAt, INVITE_WAIT),
          state: 'open' as const,
          paused: false,
          actionRoute: `/interviews/${a.id}`,
          oversightRoute: `/interviews/${a.id}`,
        }));
    },
  },
  {
    // A confirmed interview: Admin holds it and records how it went, so the notes reach the offer decision (144). The nudge comes before it starts.
    kind: 'interview_conduct',
    nudgeBefore: hours(3),
    escalateAfter: hours(24),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      return src.applications
        .filter((a) => a.status === 'approved' && a.interview?.slot && (a.interview.status === 'scheduled' || a.interview.status === 'completed'))
        .map((a) => {
          const i = a.interview as NonNullable<typeof a.interview>;
          const slot = i.slot as NonNullable<typeof i.slot>;
          const d = new Date(slot.start);
          const p = (n: number) => String(n).padStart(2, '0');
          return {
            ...base('interview_conduct', 'application', `${a.id}:${slot.start}`),
            ownerUserId: admin,
            titleKey: 'work.title.interview_conduct',
            titleParams: { name: a.form.personal.fullName, when: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` },
            dueAt: plus(slot.end, minutes(30)),
            state: i.completed ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: i.completed?.at,
            actionRoute: `/interviews/${a.id}`,
            oversightRoute: `/interviews/${a.id}`,
          };
        });
    },
  },
  {
    // Everything an approved applicant must have checked before an offer (145): chased until nothing is pending, failed or lapsed.
    kind: 'verification_pending',
    nudgeBefore: hours(12),
    escalateAfter: hours(48),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      const now = Date.now();
      return src.applications
        .filter((a) => a.status === 'approved' && a.screening?.decision && (a.interview || a.verification || now - new Date(a.screening.decision.at).getTime() < INTERVIEW_ARRANGE_DUE * 10))
        .map((a) => {
          const g = verificationGate(requiredVerification(a.role, a.form), a.verification, now);
          const open = g.pending.length + g.failed.length + g.lapsed.length;
          return {
            ...base('verification_pending', 'application', a.id),
            ownerUserId: admin,
            titleKey: 'work.title.verification_pending',
            titleParams: { name: a.form.personal.fullName, count: String(open) },
            dueAt: plus((a.screening as NonNullable<typeof a.screening>).decision!.at, VERIFY_DUE),
            state: open === 0 ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: open === 0 ? (Object.values(a.verification?.records ?? {}).map((r) => r.at).sort().pop() ?? undefined) : undefined,
            actionRoute: `/verification/${a.id}`,
            oversightRoute: `/verification/${a.id}`,
          };
        });
    },
  },
  {
    // A document allowed conditionally has a firm deadline: Admin chases it before it lapses (145).
    kind: 'verification_conditional_due',
    nudgeBefore: days(3),
    escalateAfter: hours(24),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      return src.applications.flatMap((a) =>
        Object.entries(a.verification?.records ?? {}).flatMap(([key, r]) => {
          const was = r.history.find((h) => h.status === 'conditional' && h.dueAt);
          const due = r.status === 'conditional' ? r.conditional?.dueAt : r.status === 'passed' ? was?.dueAt : undefined;
          if (!due) return [];
          return [
            {
              ...base('verification_conditional_due', 'application', `${a.id}:${key}`),
              ownerUserId: admin,
              titleKey: 'work.title.verification_conditional_due',
              titleParams: { name: a.form.personal.fullName },
              dueAt: due,
              state: r.status === 'passed' ? ('done' as const) : ('open' as const),
              paused: false,
              completedAt: r.status === 'passed' ? r.at : undefined,
              actionRoute: `/verification/${a.id}`,
              oversightRoute: `/verification/${a.id}`,
            },
          ];
        }),
      );
    },
  },
  {
    // Everything is in place for an approved applicant: Admin prepares and sends the agreement (146).
    kind: 'offer_prepare',
    nudgeBefore: hours(12),
    escalateAfter: hours(48),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      const now = Date.now();
      return src.applications
        .filter((a) => a.status === 'approved' && a.screening?.decision && (a.offer || a.interview || a.verification || now - new Date(a.screening.decision.at).getTime() < INTERVIEW_ARRANGE_DUE * 10))
        .filter((a) => !(a.interview && ['invited', 'scheduled', 'missed'].includes(a.interview.status)))
        .filter((a) => !a.waitlist || a.offer)
        .filter((a) => verificationGate(requiredVerification(a.role, a.form), a.verification, now).state !== 'blocked' || (a.offer && a.offer.status !== 'withdrawn'))
        .map((a) => {
          const sent = !!a.offer && (a.offer.status === 'sent' || a.offer.status === 'signed');
          const readyAt = [a.screening?.decision?.at, a.interview?.completed?.at, a.interview?.skipped?.at, ...Object.values(a.verification?.records ?? {}).map((r) => r.at)].filter(Boolean).sort().pop() as string;
          return {
            ...base('offer_prepare', 'application', a.id),
            ownerUserId: admin,
            titleKey: 'work.title.offer_prepare',
            titleParams: { name: a.form.personal.fullName },
            dueAt: plus(readyAt, OFFER_PREPARE_DUE),
            state: sent ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: sent ? a.offer?.sentAt : undefined,
            actionRoute: `/offers/${a.id}`,
            oversightRoute: `/offers/${a.id}`,
          };
        });
    },
  },
  {
    // An agreement sent and not signed: Admin follows up (the automatic nudge goes out once) (146).
    kind: 'offer_signature_wait',
    nudgeBefore: hours(6),
    escalateAfter: hours(48),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      return src.applications
        .filter((a) => a.offer && (a.offer.status === 'sent' || a.offer.status === 'signed') && a.offer.sentAt)
        .map((a) => {
          const o = a.offer as NonNullable<typeof a.offer>;
          return {
            ...base('offer_signature_wait', 'application', a.id),
            ownerUserId: admin,
            titleKey: 'work.title.offer_signature_wait',
            titleParams: { name: a.form.personal.fullName },
            dueAt: plus(o.sentAt as string, OFFER_SIGN_WAIT),
            state: o.status === 'signed' ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: o.signature?.at,
            actionRoute: `/offers/${a.id}`,
            oversightRoute: `/offers/${a.id}`,
          };
        });
    },
  },
  {
    // Signed, but the remaining onboarding steps (bank, photo) are not finished: payouts wait for them, so Admin chases (146).
    kind: 'partner_onboarding_finish',
    nudgeBefore: days(1),
    escalateAfter: hours(48),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      return src.applications
        .filter((a) => a.offer?.status === 'signed' && a.offer.activation)
        .map((a) => {
          const act = (a.offer as NonNullable<typeof a.offer>).activation as NonNullable<NonNullable<typeof a.offer>['activation']>;
          const steps = Object.values(act.steps);
          const done = steps.every((x) => x.done);
          return {
            ...base('partner_onboarding_finish', 'application', a.id),
            ownerUserId: admin,
            titleKey: 'work.title.partner_onboarding_finish',
            titleParams: { name: a.form.personal.fullName, count: String(steps.filter((x) => !x.done).length) },
            dueAt: plus(act.at, OFFER_STEPS_DUE),
            state: done ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: done ? steps.map((x) => x.at ?? '').sort().pop() || act.at : undefined,
            actionRoute: `/offers/${a.id}`,
            oversightRoute: `/offers/${a.id}`,
          };
        });
    },
  },
  {
    // Someone qualified is kept waiting because there is no room to activate them: a decision, never an open-ended queue (147).
    kind: 'waitlist_review',
    nudgeBefore: days(3),
    escalateAfter: days(3),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      return src.applications
        .filter((a) => a.waitlist && a.offer?.status !== 'signed')
        .map((a) => ({
          ...base('waitlist_review', 'application', a.id),
          ownerUserId: admin,
          titleKey: 'work.title.waitlist_review',
          titleParams: { name: a.form.personal.fullName },
          dueAt: plus((a.waitlist as NonNullable<typeof a.waitlist>).at, WAITLIST_REVIEW_AFTER),
          state: 'open' as const,
          paused: false,
          actionRoute: '/recruitment',
          oversightRoute: '/recruitment',
        }));
    },
  },
  {
    // A partner's question about the tier they hold: Admin answers it from the criteria as they stood, within days (148).
    kind: 'tier_dispute_decide',
    nudgeBefore: days(1),
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      return src.tierDisputes.map((d) => ({
        ...base('tier_dispute_decide', 'application', d.id),
        ownerUserId: admin,
        titleKey: 'work.title.tier_dispute_decide',
        titleParams: { name: src.users.find((u) => u.id === d.userId)?.name ?? src.suppliers.find((x) => x.id === d.userId)?.name ?? d.userId },
        dueAt: plus(d.raisedAt, TIER_DISPUTE_DUE),
        state: d.status === 'decided' ? ('done' as const) : ('open' as const),
        paused: false,
        completedAt: d.decision?.at,
        actionRoute: `/partner-tiers/${d.userId}`,
        oversightRoute: `/partner-tiers/${d.userId}`,
      }));
    },
  },
  {
    // After the bar was raised, a partner who no longer meets their tier stays where they are and is reviewed by a date, never reassessed silently (148).
    kind: 'tier_review_due',
    nudgeBefore: days(7),
    escalateAfter: days(7),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      return src.tierReviews.map((r) => ({
        ...base('tier_review_due', 'application', `${r.userId}:${r.versionId}`),
        ownerUserId: admin,
        titleKey: 'work.title.tier_review_due',
        titleParams: { name: src.users.find((u) => u.id === r.userId)?.name ?? r.userId },
        dueAt: new Date(`${r.dueBy}T09:00:00`).toISOString(),
        state: r.resolved ? ('done' as const) : ('open' as const),
        paused: false,
        completedAt: r.resolved?.at,
        actionRoute: `/partner-tiers/${r.userId}`,
        oversightRoute: `/partner-tiers/${r.userId}`,
      }));
    },
  },
  {
    // Training Admin asked a partner to finish by a date: the partner owns it, reminded before the date and Admin hears if it passes (157).
    kind: 'training_assignment',
    nudgeBefore: days(2),
    escalateAfter: days(3),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      return src.trainingAssignments
        .filter((x) => x.ownerActive)
        .map((x) => ({
          ...base('training_assignment', 'application', x.a.id),
          ownerUserId: x.a.userId,
          titleKey: 'work.title.training_assignment',
          titleParams: { module: x.moduleCode },
          dueAt: new Date(`${x.a.dueDate}T17:00:00`).toISOString(),
          state: x.done ? ('done' as const) : ('open' as const),
          paused: false,
          actionRoute: `/training/${x.a.moduleId}`,
          oversightRoute: '/skill-matrix',
        }));
    },
  },
  {
    // A partner says something in a training looks wrong or unsafe: Admin looks at it straight away (sooner for safety training); done when it is handled or hidden (160).
    kind: 'training_feedback_urgent',
    nudgeBefore: hours(2),
    escalateAfter: hours(24),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      return src.trainingFeedback.urgent.map((x) => ({
        ...base('training_feedback_urgent', 'application', x.f.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.training_feedback_urgent',
        titleParams: { module: x.code },
        dueAt: feedbackDueAt(true, x.safety, x.f.createdAt),
        state: 'open' as const,
        paused: false,
        actionRoute: `/training-feedback/${x.f.moduleId}?item=${x.f.id}`,
        oversightRoute: `/training-feedback/${x.f.moduleId}?item=${x.f.id}`,
      }));
    },
  },
  {
    // Routine feedback is read at least every couple of weeks, so it results in a visible improvement and is not collected and forgotten (160).
    kind: 'training_feedback_review',
    nudgeBefore: days(2),
    escalateAfter: days(7),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const r = src.trainingFeedback.routine;
      if (r.open === 0 || !r.oldestAt) return [];
      return [
        {
          ...base('training_feedback_review', 'application', 'standing'),
          ownerUserId: adminId(src),
          titleKey: 'work.title.training_feedback_review',
          titleParams: { count: String(r.open) },
          dueAt: new Date(Date.parse(r.oldestAt) + FEEDBACK_REVIEW_DAYS * 86_400_000).toISOString(),
          state: 'open' as const,
          paused: false,
          actionRoute: '/training-feedback',
          oversightRoute: '/training-feedback',
        },
      ];
    },
  },
  {
    // Payouts are looked at before they are released, and the routine ones cleared together (163). One standing line while anything waits, so a busy week is one task, not sixty.
    kind: 'payout_approval',
    nudgeBefore: days(1),
    escalateAfter: days(3),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const w = src.payoutApprovals.pending;
      if (w.count === 0 || !w.oldestAt) return [];
      return [
        {
          ...base('payout_approval', 'application', 'standing'),
          ownerUserId: adminId(src),
          titleKey: 'work.title.payout_approval',
          titleParams: { count: String(w.count) },
          dueAt: new Date(Date.parse(w.oldestAt) + PAYOUT_APPROVE_DUE).toISOString(),
          state: 'open' as const,
          paused: false,
          actionRoute: '/payout-approval',
          oversightRoute: '/payout-approval',
        },
      ];
    },
  },
  {
    // A cleared payout that did not reach the partner, or has nowhere to go, is somebody's money waiting (164). One standing line while anything needs attention.
    kind: 'payout_disbursement_attention',
    nudgeBefore: hours(4),
    escalateAfter: days(2),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const w = src.payoutDisbursements.attention;
      if (w.count === 0 || !w.oldestAt) return [];
      return [
        {
          ...base('payout_disbursement_attention', 'application', 'standing'),
          ownerUserId: adminId(src),
          titleKey: 'work.title.payout_disbursement_attention',
          titleParams: { count: String(w.count) },
          dueAt: new Date(Date.parse(w.oldestAt) + PAYOUT_ATTENTION_DUE).toISOString(),
          state: 'open' as const,
          paused: false,
          actionRoute: '/payout-disbursement?state=attention',
          oversightRoute: '/payout-disbursement?state=attention',
        },
      ];
    },
  },
  {
    // A partner is told a contest they can win is running (the launch), and again in its last day (167). Heads-ups on their own list, never work: they are cancelled when the contest ends.
    kind: 'contest_live',
    nudgeBefore: days(365),
    escalateAfter: days(365),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      return src.contests.live.map((x) => ({
        ...base('contest_live', 'application', `${x.contestId}:${x.userId}`),
        ownerUserId: x.userId,
        titleKey: 'work.title.contest_live',
        titleParams: { name: x.name },
        dueAt: x.endsAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/rewards-leaderboard?contest=${x.contestId}`,
        oversightRoute: '/contest-setup',
      }));
    },
  },
  {
    kind: 'contest_closing',
    nudgeBefore: days(2),
    escalateAfter: days(365),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      return src.contests.live.filter((x) => x.closing).map((x) => ({
        ...base('contest_closing', 'application', `${x.contestId}:${x.userId}`),
        ownerUserId: x.userId,
        titleKey: 'work.title.contest_closing',
        titleParams: { name: x.name },
        dueAt: x.endsAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/rewards-leaderboard?contest=${x.contestId}`,
        oversightRoute: '/contest-setup',
      }));
    },
  },
  {
    // The result is told to everyone who took part, with their own place (167), for a week.
    kind: 'contest_result',
    nudgeBefore: days(30),
    escalateAfter: days(365),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      return src.contests.results.map((x) => ({
        ...base('contest_result', 'application', `${x.contestId}:${x.userId}`),
        ownerUserId: x.userId,
        titleKey: x.early ? 'work.title.contest_result_early' : 'work.title.contest_result',
        titleParams: { name: x.name, rank: String(x.rank), total: String(x.total) },
        dueAt: new Date(Date.parse(x.closedAt) + 7 * 86_400_000).toISOString(),
        state: x.open ? ('open' as const) : ('cancelled' as const),
        paused: false,
        actionRoute: `/rewards-leaderboard?contest=${x.contestId}`,
        oversightRoute: '/contest-setup',
      }));
    },
  },
  {
    // A customer who was unhappy, or who rated one part of their experience poorly, is reached by a person rather than silently recorded (177).
    kind: 'feedback_outreach',
    nudgeBefore: hours(6),
    escalateAfter: hours(24),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      return src.feedback.outreach.map((x) => ({
        ...base('feedback_outreach', 'service_ticket', x.id),
        ownerUserId: adminId(src),
        titleKey: x.weakOnly ? 'work.title.feedback_outreach_weak' : 'work.title.feedback_outreach',
        titleParams: { name: x.customer, code: x.code },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/feedback/${x.id}`,
        oversightRoute: `/feedback/${x.id}`,
      }));
    },
  },
  {
    // A customer thanked a technician by name: they hear it, on their own list, for a week; it is never work (177).
    kind: 'feedback_recognition',
    nudgeBefore: days(30),
    escalateAfter: days(365),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      return src.feedback.recognitions.map((x) => ({
        ...base('feedback_recognition', 'service_ticket', x.id),
        ownerUserId: x.userId,
        titleKey: 'work.title.feedback_recognition',
        titleParams: { name: x.from },
        dueAt: new Date(Date.parse(x.at) + days(7)).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: '/badges',
        oversightRoute: '/feedback',
      }));
    },
  },
  {
    // A customer whose referral became an order is told the reward was issued, on their own list, for a week; it is never work (179).
    kind: 'referral_reward',
    nudgeBefore: days(30),
    escalateAfter: days(365),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      return src.referrals.rewards.map((x) => ({
        ...base('referral_reward', 'lead', x.id),
        ownerUserId: x.userId,
        titleKey: 'work.title.referral_reward',
        titleParams: { name: x.friend },
        dueAt: new Date(Date.parse(x.at) + days(7)).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: '/referrals',
        oversightRoute: '/payout-approval',
      }));
    },
  },
  {
    // An emergency pause on a category of automation (181) is a deliberate stop, not a state to forget: Admin is asked a day later whether it should still be paused.
    kind: 'automation_pause_review',
    nudgeBefore: hours(2),
    escalateAfter: hours(24),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.automationPauses.map((x) => ({
        ...base('automation_pause_review', 'alert', x.category),
        ownerUserId: adminId(src),
        titleKey: 'work.title.automation_pause_review',
        titleParams: { category: x.name },
        dueAt: new Date(Date.parse(x.since) + hours(24)).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: `/automation-rules?category=${x.category}`,
        oversightRoute: '/automation-rules',
      }));
    },
  },
  {
    // An escalation chain nobody has tested is a guess (184): a drill is owed on each scenario's rhythm, and again soon after the chain or a backup changed.
    kind: 'escalation_drill_due',
    nudgeBefore: days(2),
    escalateAfter: days(7),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.escalation.drills.map((x) => ({
        ...base('escalation_drill_due', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.escalation_drill_due',
        titleParams: { scenario: x.name },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/escalation-matrix?scenario=${x.id}`,
        oversightRoute: '/escalation-matrix',
      }));
    },
  },
  {
    // A drill that found a gap is not a result to file: the fix is due within a day, and it is open until a later drill passes or the gap is accepted in writing (184).
    kind: 'escalation_gap_fix',
    nudgeBefore: hours(4),
    escalateAfter: hours(24),
    escalates: true,
    raisesAlert: true,
    alertCategory: 'automation',
    collect(src) {
      return src.escalation.gaps.map((x) => ({
        ...base('escalation_gap_fix', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.escalation_gap_fix',
        titleParams: { scenario: x.name },
        dueAt: new Date(Date.parse(x.since) + hours(24)).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: `/escalation-matrix?scenario=${x.scenarioId}`,
        oversightRoute: '/escalation-matrix',
      }));
    },
  },
  {
    // A provider coming back is not the end of an outage (186): messages that did not go, payouts that failed or statements that were not fetched are owed a person until Admin closes them.
    kind: 'integration_followup',
    nudgeBefore: hours(4),
    escalateAfter: hours(24),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.integrations.followUps.map((x) => ({
        ...base('integration_followup', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.integration_followup',
        titleParams: { name: x.name, count: String(x.count) },
        dueAt: new Date(Date.parse(x.since) + hours(24)).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: `/system-health?incident=${x.id}`,
        oversightRoute: '/system-health',
      }));
    },
  },
  {
    // A credential is not set once and forgotten (189): the one in use is rotated on a rhythm, and Admin is reminded ahead of it.
    kind: 'integration_credential_rotation',
    nudgeBefore: days(14),
    escalateAfter: days(14),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.integrations.rotations.map((x) => ({
        ...base('integration_credential_rotation', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.integration_credential_rotation',
        titleParams: { name: x.name },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/integrations?integration=${x.id.split(':')[0]}`,
        oversightRoute: '/integrations',
      }));
    },
  },
  {
    // A good change should not get lost (190): a rule that passed its standard scenarios and is still not live is Admin's to promote or put aside, within a week.
    kind: 'sandbox_promotion_pending',
    nudgeBefore: days(1),
    escalateAfter: days(7),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.sandbox.promotions.map((x) => ({
        ...base('sandbox_promotion_pending', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.sandbox_promotion_pending',
        titleParams: { name: x.name },
        dueAt: new Date(Date.parse(x.since) + days(7)).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: `/automation-sandbox?rule=${x.id}`,
        oversightRoute: '/automation-sandbox',
      }));
    },
  },
  {
    // A person's request about their own data is a legal obligation with a clock (194): answered, partly answered with the reasons, or refused with one, within the target.
    kind: 'privacy_request_respond',
    nudgeBefore: days(7),
    escalateAfter: days(3),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.privacy.requests.map((x) => ({
        ...base('privacy_request_respond', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.privacy_request_respond',
        titleParams: { name: x.name, type: x.type },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/privacy?tab=requests&request=${x.id}`,
        oversightRoute: '/privacy?tab=requests',
      }));
    },
  },
  {
    // A material change to the privacy policy is told to the people it affects before it takes effect (194).
    kind: 'privacy_policy_notice',
    nudgeBefore: days(3),
    escalateAfter: days(7),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.privacy.notices.map((x) => ({
        ...base('privacy_policy_notice', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.privacy_policy_notice',
        titleParams: { version: String(x.version) },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: '/privacy?tab=policy',
        oversightRoute: '/privacy?tab=policy',
      }));
    },
  },
  {
    // Records past a retention period that this build does not remove itself are decided by a person (194).
    kind: 'privacy_retention_review',
    nudgeBefore: days(3),
    escalateAfter: days(14),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.privacy.reviews.map((x) => ({
        ...base('privacy_retention_review', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.privacy_retention_review',
        titleParams: { category: x.id, count: String(x.count) },
        dueAt: new Date(Date.parse(x.since) + days(30)).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: '/privacy?tab=retention',
        oversightRoute: '/privacy?tab=retention',
      }));
    },
  },
  {
    // A sign-in from somewhere new is asked about: the person confirms it in one tap, or Admin does after speaking to them (195). Not a lockout, but not left open either.
    kind: 'security_place_review',
    nudgeBefore: hours(4),
    escalateAfter: hours(24),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.security.places.map((x) => ({
        ...base('security_place_review', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.security_place_review',
        titleParams: { name: x.name },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/security?tab=accounts&account=${x.userId}`,
        oversightRoute: '/security?tab=accounts',
      }));
    },
  },
  {
    // A person who cannot use the second step has asked to be excused: a documented answer, not a silent one (195).
    kind: 'security_2fa_exception_decide',
    nudgeBefore: hours(12),
    escalateAfter: days(2),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.security.requests.map((x) => ({
        ...base('security_2fa_exception_decide', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.security_2fa_exception_decide',
        titleParams: { name: x.name },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/security?tab=exceptions&exception=${x.id}`,
        oversightRoute: '/security?tab=exceptions',
      }));
    },
  },
  {
    // An exception to the second step has an end date: it is looked at before it lapses, extended on purpose or let go (195).
    kind: 'security_2fa_exception_review',
    nudgeBefore: days(7),
    escalateAfter: days(3),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.security.exceptions.map((x) => ({
        ...base('security_2fa_exception_review', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.security_2fa_exception_review',
        titleParams: { name: x.name },
        dueAt: x.until,
        state: 'open' as const,
        paused: false,
        actionRoute: `/security?tab=exceptions&exception=${x.id}`,
        oversightRoute: '/security?tab=exceptions',
      }));
    },
  },
  {
    // A locked account is a person who cannot work: Admin owes them a verified way back within a day (195).
    kind: 'security_account_recovery',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.security.locks.map((x) => ({
        ...base('security_account_recovery', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.security_account_recovery',
        titleParams: { name: x.name },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/security?tab=accounts&account=${x.userId}`,
        oversightRoute: '/security?tab=accounts',
      }));
    },
  },
  {
    // A backup that failed is a gap in the one thing that saves the business in a disaster: it is put right, or its cause understood, within hours (196).
    kind: 'backup_failure_followup',
    nudgeBefore: minutes(30),
    escalateAfter: hours(4),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.backups.failures.map((x) => ({
        ...base('backup_failure_followup', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.backup_failure_followup',
        titleParams: { code: x.code },
        dueAt: new Date(Date.parse(x.at) + hours(4)).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: '/backups',
        oversightRoute: '/backups',
      }));
    },
  },
  {
    // A backup nobody has ever restored is a hope, not a backup: a restore is tried and recorded on a rhythm (196).
    kind: 'backup_restore_test',
    nudgeBefore: days(7),
    escalateAfter: days(14),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.backups.test ? [{
        ...base('backup_restore_test', 'alert', 'restore-test'),
        ownerUserId: adminId(src),
        titleKey: 'work.title.backup_restore_test',
        titleParams: {},
        dueAt: src.backups.test.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: '/backups',
        oversightRoute: '/backups',
      }] : [];
    },
  },
  {
    // A finished export is personal or financial data sitting ready: it is collected, or it is removed, never left (196).
    kind: 'export_collect',
    nudgeBefore: hours(12),
    escalateAfter: days(1),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.backups.exports.map((x) => ({
        ...base('export_collect', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.export_collect',
        titleParams: { code: x.code },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: '/backups?tab=exports',
        oversightRoute: '/backups?tab=exports',
      }));
    },
  },
  {
    // A bill that failed, or a card about to stop working, can stop a service the whole app runs on: put right before it does (197).
    kind: 'billing_payment_fix',
    nudgeBefore: days(2),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.billing.fixes.map((x) => ({
        ...base('billing_payment_fix', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.billing_payment_fix',
        titleParams: { name: x.name },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/billing?service=${x.id}`,
        oversightRoute: '/billing',
      }));
    },
  },
  {
    // A service that does not renew by itself has to be renewed by a person, in time (197).
    kind: 'billing_renewal_due',
    nudgeBefore: days(4),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.billing.renewals.map((x) => ({
        ...base('billing_renewal_due', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.billing_renewal_due',
        titleParams: { name: x.name },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/billing?service=${x.id}`,
        oversightRoute: '/billing',
      }));
    },
  },
  {
    // A legal review that found a problem with wording already in use is not left as information: it is corrected and re-versioned within days (198).
    kind: 'legal_issue_fix',
    nudgeBefore: hours(12),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.legal.fixes.map((x) => ({
        ...base('legal_issue_fix', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.legal_issue_fix',
        titleParams: { name: x.name },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/legal-templates?review=${x.id}`,
        oversightRoute: '/legal-templates',
      }));
    },
  },
  {
    // Wording is looked at again by a professional on its own rhythm, and again after it changes (198).
    kind: 'legal_review_due',
    nudgeBefore: days(14),
    escalateAfter: days(14),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.legal.reviews.map((x) => ({
        ...base('legal_review_due', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.legal_review_due',
        titleParams: { name: x.name },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/legal-templates?doc=${encodeURIComponent(x.id)}`,
        oversightRoute: '/legal-templates?tab=reviews',
      }));
    },
  },
  {
    // Help that is wrong, out of date or points at a screen that is gone does more harm than none (199): one standing line for the whole library.
    kind: 'help_content_attention',
    nudgeBefore: days(2),
    escalateAfter: days(7),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      const c = src.help.content;
      if (!c) return [];
      return [{
        ...base('help_content_attention', 'alert', 'help:content'),
        ownerUserId: adminId(src),
        titleKey: 'work.title.help_content_attention',
        titleParams: { count: String(c.count) },
        dueAt: c.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: '/help?tab=manage&flag=attention',
        oversightRoute: '/help?tab=manage',
      }];
    },
  },
  {
    // A topic someone asked for is how a content gap gets found: answered within a fortnight, even if the answer is no (199).
    kind: 'help_suggestions_review',
    nudgeBefore: days(2),
    escalateAfter: days(7),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      const c = src.help.suggestions;
      if (!c) return [];
      return [{
        ...base('help_suggestions_review', 'alert', 'help:suggestions'),
        ownerUserId: adminId(src),
        titleKey: 'work.title.help_suggestions_review',
        titleParams: { count: String(c.count) },
        dueAt: c.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: '/help?tab=gaps',
        oversightRoute: '/help?tab=gaps',
      }];
    },
  },
  {
    // Someone took the trouble to say how the app could be better: it is looked at within a fortnight, even if the answer is no (200).
    kind: 'app_feedback_review',
    nudgeBefore: days(2),
    escalateAfter: days(7),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      const c = src.appFeedback;
      if (!c) return [];
      return [{
        ...base('app_feedback_review', 'alert', 'appinfo:feedback'),
        ownerUserId: adminId(src),
        titleKey: 'work.title.app_feedback_review',
        titleParams: { count: String(c.count) },
        dueAt: c.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: '/app-info?tab=inbox',
        oversightRoute: '/app-info?tab=inbox',
      }];
    },
  },
  {
    // The morning check is the discipline the whole system is built around (193): owed on each day the Admin has chosen, until a check is recorded; days they are away do not count.
    kind: 'monitor_daily_check',
    nudgeBefore: minutes(30),
    escalateAfter: hours(24),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.monitor.checks.map((x) => ({
        ...base('monitor_daily_check', 'alert', `${x.adminId}:${x.day}`),
        ownerUserId: x.adminId,
        titleKey: 'work.title.monitor_daily_check',
        titleParams: {},
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: '/monitor',
        oversightRoute: '/monitor',
      }));
    },
  },
  {
    // Something the Admin knows that no number shows is not forgotten (193): it comes back on the day they set.
    kind: 'monitor_concern_followup',
    nudgeBefore: hours(4),
    escalateAfter: days(3),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.monitor.concerns.map((x) => ({
        ...base('monitor_concern_followup', 'alert', x.id),
        ownerUserId: x.adminId,
        titleKey: 'work.title.monitor_concern_followup',
        titleParams: { note: x.note.length > 60 ? `${x.note.slice(0, 57)}…` : x.note },
        dueAt: x.reviewAt,
        state: 'open' as const,
        paused: false,
        actionRoute: '/monitor',
        oversightRoute: '/monitor',
      }));
    },
  },
  {
    // An exception to someone's role is not a permanent arrangement (192): it is looked at again on a rhythm, or when its own end comes.
    kind: 'permission_override_review',
    nudgeBefore: days(7),
    escalateAfter: days(14),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.permissions.reviews.map((x) => ({
        ...base('permission_override_review', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.permission_override_review',
        titleParams: { name: x.name, screen: x.screen },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: '/access-control?tab=users',
        oversightRoute: '/access-control',
      }));
    },
  },
  {
    // A change of GSTIN or registered address is checked after it takes effect (191): the first documents, the GST portal and the accountant.
    kind: 'company_profile_legal_verify',
    nudgeBefore: days(2),
    escalateAfter: days(7),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.companyProfile.verify.map((x) => ({
        ...base('company_profile_legal_verify', 'alert', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.company_profile_legal_verify',
        titleParams: { version: String(x.version) },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/company-profile?version=${x.id}`,
        oversightRoute: '/company-profile',
      }));
    },
  },
  {
    // Standard scenarios drift as the business does (190): the library is looked at again every few months.
    kind: 'sandbox_library_review',
    nudgeBefore: days(14),
    escalateAfter: days(30),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'automation',
    collect(src) {
      return src.sandbox.review
        ? [{
            ...base('sandbox_library_review', 'alert', 'library'),
            ownerUserId: adminId(src),
            titleKey: 'work.title.sandbox_library_review',
            titleParams: {},
            dueAt: src.sandbox.review.dueAt,
            state: 'open' as const,
            paused: false,
            actionRoute: '/automation-sandbox?tab=library',
            oversightRoute: '/automation-sandbox',
          }]
        : [];
    },
  },
  {
    // A customer waiting for a person in the support chat (176): answered within the reply target, sooner when the assistant flagged a safety concern.
    kind: 'support_chat_reply',
    nudgeBefore: minutes(15),
    escalateAfter: minutes(60),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'sla_breach',
    collect(src) {
      return src.supportChats.waiting.map((x) => ({
        ...base('support_chat_reply', 'service_ticket', x.id),
        ownerUserId: adminId(src),
        titleKey: x.urgent ? 'work.title.support_chat_reply_urgent' : 'work.title.support_chat_reply',
        titleParams: { name: x.name },
        dueAt: new Date(Date.parse(x.since) + (x.urgent ? minutes(15) : minutes(60))).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: `/support-chat/${x.id}`,
        oversightRoute: `/support-chat/${x.id}`,
      }));
    },
  },
  {
    // A customer's request is answered by the time they were told (175): a person on call within minutes for an emergency, hours for a safety concern.
    kind: 'service_ticket_respond',
    nudgeBefore: minutes(10),
    escalateAfter: minutes(30),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'sla_breach',
    collect(src) {
      return src.serviceTickets.respond.map((x) => ({
        ...base('service_ticket_respond', 'service_ticket', x.id),
        ownerUserId: x.ownerUserId,
        titleKey: x.urgency === 'emergency' ? 'work.title.service_ticket_respond_emergency' : 'work.title.service_ticket_respond',
        titleParams: { code: x.code, site: x.site },
        dueAt: x.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/service-requests/${x.id}`,
        oversightRoute: `/service-requests/${x.id}`,
      }));
    },
  },
  {
    // The technician's own promise: the service visit at the time agreed (175), in their inbox the moment they are named.
    kind: 'service_visit',
    nudgeBefore: hours(12),
    escalateAfter: hours(4),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      return src.serviceTickets.visits.map((x) => ({
        ...base('service_visit', 'service_ticket', x.id),
        ownerUserId: x.technicianId,
        titleKey: 'work.title.service_visit',
        titleParams: { code: x.code, site: x.site, date: x.date },
        dueAt: x.dueAt,
        state: x.state,
        paused: false,
        actionRoute: `/service-requests/${x.id}`,
        oversightRoute: `/service-requests/${x.id}`,
      }));
    },
  },
  {
    // Whose fault a defect is must be decided by a person from the installation's record, and the customer waits for the answer (175).
    kind: 'service_claim_review',
    nudgeBefore: days(1),
    escalateAfter: days(1),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      return src.serviceTickets.claims.map((x) => ({
        ...base('service_claim_review', 'service_ticket', x.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.service_claim_review',
        titleParams: { code: x.code },
        dueAt: new Date(Date.parse(x.since) + days(3)).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: `/service-requests/${x.id}`,
        oversightRoute: `/service-requests/${x.id}`,
      }));
    },
  },
  {
    // A visit that did not close the request (parts needed, a follow-up, a missed visit or a lift shut down for safety) is Admin's to take forward (175).
    kind: 'service_visit_followup',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      return src.serviceTickets.followups.map((x) => ({
        ...base('service_visit_followup', 'service_ticket', x.id),
        ownerUserId: adminId(src),
        titleKey: x.unsafe ? 'work.title.service_visit_followup_unsafe' : 'work.title.service_visit_followup',
        titleParams: { code: x.code },
        dueAt: new Date(Date.parse(x.since) + (x.unsafe ? hours(4) : days(1))).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: `/service-requests/${x.id}`,
        oversightRoute: `/service-requests/${x.id}`,
      }));
    },
  },
  {
    // A partner asked about one of their own payouts: Admin answers within the set time (168).
    kind: 'payout_query_answer',
    nudgeBefore: days(1),
    escalateAfter: days(2),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      return src.payoutQueries.open.map((q) => ({
        ...base('payout_query_answer', 'application', q.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.payout_query_answer',
        titleParams: { partner: q.partnerName, code: q.code },
        dueAt: new Date(Date.parse(q.since) + PAYOUT_QUERY_DUE).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: `/payout-dispute?dispute=${q.id}`,
        oversightRoute: `/payout-dispute?dispute=${q.id}`,
      }));
    },
  },
  {
    // The answer waits on the partner's own list for a week: a heads-up, never work (168).
    kind: 'payout_query_reply',
    nudgeBefore: days(30),
    escalateAfter: days(365),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      return src.payoutQueries.answered.map((q) => ({
        ...base('payout_query_reply', 'application', `${q.id}:${q.at}`),
        ownerUserId: q.userId,
        titleKey: 'work.title.payout_query_reply',
        titleParams: { code: q.code },
        dueAt: new Date(Date.parse(q.at) + PAYOUT_QUERY_REPLY_DAYS * 86_400_000).toISOString(),
        state: Date.now() - Date.parse(q.at) < PAYOUT_QUERY_REPLY_DAYS * 86_400_000 ? ('open' as const) : ('cancelled' as const),
        paused: false,
        actionRoute: q.route ?? `/payout-history?entry=${q.entryId}`,
        oversightRoute: `/payout-dispute?dispute=${q.id}`,
      }));
    },
  },
  {
    // A partner said a payout looks wrong (170): Admin resolves it within the dispute target, or says it is escalated and keeps them told.
    kind: 'payout_dispute_resolve',
    nudgeBefore: days(1),
    escalateAfter: days(1),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      return src.payoutQueries.disputes.map((q) => ({
        ...base('payout_dispute_resolve', 'application', q.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.payout_dispute_resolve',
        titleParams: { partner: q.partnerName, code: q.code },
        dueAt: q.dueAt,
        state: 'open' as const,
        paused: false,
        actionRoute: `/payout-dispute?dispute=${q.id}`,
        oversightRoute: `/payout-dispute?dispute=${q.id}`,
      }));
    },
  },
  {
    // A dispute that pointed at the commission rules asks for a broader look, so other partners are not left short by the same cause (170).
    kind: 'payout_rule_review',
    nudgeBefore: days(2),
    escalateAfter: days(3),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      return src.payoutQueries.reviews.map((q) => ({
        ...base('payout_rule_review', 'application', q.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.payout_rule_review',
        titleParams: { code: q.code },
        dueAt: new Date(Date.parse(q.since) + PAYOUT_REVIEW_DUE).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: `/payout-dispute?dispute=${q.id}`,
        oversightRoute: `/payout-dispute?dispute=${q.id}`,
      }));
    },
  },
  {
    // Tax deducted from partners is deposited by the 7th of the next month (169): Admin records the accountant's challan. Placeholder date, the accountant confirms.
    kind: 'tds_deposit',
    nudgeBefore: days(5),
    escalateAfter: days(3),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      return src.tds.deposits.map((x) => ({
        ...base('tds_deposit', 'application', x.month),
        ownerUserId: adminId(src),
        titleKey: 'work.title.tds_deposit',
        titleParams: { month: x.month },
        dueAt: x.due,
        state: x.done ? ('done' as const) : ('open' as const),
        paused: false,
        actionRoute: '/tds-statement',
        oversightRoute: '/tds-statement',
      }));
    },
  },
  {
    // The quarterly TDS return is filed by the accountant; Admin records it so partners' certificates become final (169).
    kind: 'tds_return',
    nudgeBefore: days(10),
    escalateAfter: days(3),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      return src.tds.returns.map((x) => ({
        ...base('tds_return', 'application', `${x.fy}:${x.quarter}`),
        ownerUserId: adminId(src),
        titleKey: 'work.title.tds_return',
        titleParams: { fy: x.fy.slice(3), quarter: String(x.quarter) },
        dueAt: x.due,
        state: x.done ? ('done' as const) : ('open' as const),
        paused: false,
        actionRoute: '/tds-statement',
        oversightRoute: '/tds-statement',
      }));
    },
  },
  {
    // A payout on hold comes back for a second look so a partner is never left waiting without anyone deciding (163).
    kind: 'payout_hold_review',
    nudgeBefore: days(1),
    escalateAfter: days(3),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      return src.payoutApprovals.held.map((h) => ({
        ...base('payout_hold_review', 'application', h.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.payout_hold_review',
        titleParams: { partner: h.partnerName },
        dueAt: new Date(Date.parse(h.since) + PAYOUT_HOLD_REVIEW).toISOString(),
        state: 'open' as const,
        paused: false,
        actionRoute: `/payout-approval?state=held&entry=${h.id}`,
        oversightRoute: `/payout-approval?state=held&entry=${h.id}`,
      }));
    },
  },
  {
    // A partner is told, ahead of time, that a rate they are paid under is about to change (161). It stays in their list until the change takes effect: a heads-up, not work, so it is never counted as done.
    kind: 'commission_rule_notice',
    nudgeBefore: days(60),
    escalateAfter: days(365),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      return src.commissionNotices.map((x) => ({
        ...base('commission_rule_notice', 'application', `${x.ruleId}:v${x.version}:${x.userId}`),
        ownerUserId: x.userId,
        titleKey: `work.title.commission_notice_${x.ruleId}`,
        titleParams: { date: x.effectiveFrom, from: x.from, to: x.to },
        dueAt: new Date(`${x.effectiveFrom}T00:00:00`).toISOString(),
        state: x.open ? ('open' as const) : ('cancelled' as const),
        paused: false,
        actionRoute: x.role === 'surveyor' ? '/surveyor/earnings' : '/technician',
        oversightRoute: '/commission-rules',
      }));
    },
  },
  {
    // A partner is told a procedure they work to is changing and must read it (and answer a short quiz on what changed, where Admin asked for one); done when they acknowledge (159).
    kind: 'sop_rollout_ack',
    nudgeBefore: days(2),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      return src.sopRollouts.acks.map((x) => ({
        ...base('sop_rollout_ack', 'application', `${x.r.id}:${x.userId}`),
        ownerUserId: x.userId,
        titleKey: 'work.title.sop_rollout_ack',
        titleParams: { code: x.r.code },
        dueAt: sopDueAt(x.r),
        state: x.done ? ('done' as const) : ('open' as const),
        // A partner who is away is not chased; they are caught up when they are back.
        paused: x.away,
        actionRoute: `/sop-rollouts/${x.r.id}`,
        oversightRoute: `/sop-rollouts/${x.r.id}`,
      }));
    },
  },
  {
    // Admin looks at who has still not acknowledged a procedure change when its day comes (159).
    kind: 'sop_rollout_close',
    nudgeBefore: days(1),
    escalateAfter: days(3),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      return src.sopRollouts.closes.map((x) => ({
        ...base('sop_rollout_close', 'application', x.r.id),
        ownerUserId: adminId(src),
        titleKey: 'work.title.sop_rollout_close',
        titleParams: { code: x.r.code, count: String(x.pending) },
        dueAt: sopDueAt(x.r),
        state: x.pending === 0 ? ('done' as const) : ('open' as const),
        paused: false,
        actionRoute: `/sop-rollouts/${x.r.id}`,
        oversightRoute: `/sop-rollouts/${x.r.id}`,
      }));
    },
  },
  {
    // The owner looks at whether the whole workforce is properly trained, at least monthly; each look is kept as a dated record for an auditor (158).
    kind: 'compliance_review',
    nudgeBefore: days(3),
    escalateAfter: days(7),
    escalates: false,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      return [
        {
          ...base('compliance_review', 'application', src.complianceReview.cycle),
          ownerUserId: adminId(src),
          titleKey: 'work.title.compliance_review',
          titleParams: {},
          dueAt: src.complianceReview.dueAt,
          state: src.complianceReview.done ? ('done' as const) : ('open' as const),
          paused: false,
          actionRoute: '/training-compliance',
          oversightRoute: '/training-compliance',
        },
      ];
    },
  },
  {
    // A time-limited certification ends: its holder renews it by passing the test again, reminded a month ahead the way any expiring credential is (155).
    kind: 'certification_renewal',
    nudgeBefore: days(30),
    escalateAfter: days(7),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      return src.certRenewals
        .filter((c) => c.ownerActive)
        .map((c) => ({
          ...base('certification_renewal', 'application', c.badgeId),
          ownerUserId: c.userId,
          titleKey: 'work.title.certification_renewal',
          titleParams: { module: c.moduleCode },
          dueAt: c.expiresAt,
          state: c.renewed ? ('done' as const) : ('open' as const),
          paused: false,
          actionRoute: `/assessment/${c.moduleId}`,
          oversightRoute: `/assessment?partner=${c.userId}`,
        }));
    },
  },
  {
    // Work a leaving partner still holds: handed on by their last day (at once for a removal), by Admin (150).
    kind: 'exit_work_handover',
    nudgeBefore: hours(12),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'staffing',
    collect(src) {
      const admin = adminId(src);
      return src.exits.map(({ exit, workOpen }) => ({
        ...base('exit_work_handover', 'application', exit.id),
        ownerUserId: admin,
        titleKey: 'work.title.exit_work_handover',
        titleParams: { name: exit.partnerName, count: String(workOpen) },
        dueAt: exit.kind === 'involuntary' ? plus(exit.startedAt, INVOLUNTARY_WORK_DUE) : new Date(`${exit.lastDay}T17:00:00`).toISOString(),
        state: workOpen === 0 ? ('done' as const) : ('open' as const),
        paused: false,
        actionRoute: `/partner-exit/${exit.partnerId}`,
        oversightRoute: `/partner-exit/${exit.partnerId}`,
      }));
    },
  },
  {
    // What a leaving partner is owed: worked out from the ledgers within days, and paid soon after access ends (150).
    kind: 'exit_settlement',
    nudgeBefore: days(1),
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const admin = adminId(src);
      return src.exits.map(({ exit }) => {
        const s = exit.settlement;
        const total = s ? s.amount + (s.adjustment?.amount ?? 0) : 0;
        const done = !!s && (s.status === 'paid' || (s.status === 'agreed' && !s.withheld && total <= 0));
        return {
          ...base('exit_settlement', 'application', exit.id),
          ownerUserId: admin,
          titleKey: s ? 'work.title.exit_settlement_pay' : 'work.title.exit_settlement',
          titleParams: { name: exit.partnerName },
          dueAt: s ? plus(exit.accessRevoked?.at ?? new Date(`${exit.lastDay}T00:00:00`).toISOString(), PAY_DUE_AFTER_ACCESS) : plus(exit.startedAt, SETTLEMENT_DUE),
          state: done ? ('done' as const) : ('open' as const),
          paused: s?.status === 'disputed',
          completedAt: s?.paid?.at,
          actionRoute: `/partner-exit/${exit.partnerId}`,
          oversightRoute: `/partner-exit/${exit.partnerId}`,
        };
      });
    },
  },
  {
    // A leaving partner who says they are owed more: decided with the reasons written down, like any payout dispute (150).
    kind: 'exit_dispute_decide',
    nudgeBefore: days(1),
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const admin = adminId(src);
      return src.exits.flatMap(({ exit }) => (exit.settlement?.dispute ? [exit.settlement.dispute] : []).map((d) => ({
        ...base('exit_dispute_decide', 'application', d.id),
        ownerUserId: admin,
        titleKey: 'work.title.exit_dispute_decide',
        titleParams: { name: exit.partnerName },
        dueAt: plus(d.raisedAt, EXIT_DISPUTE_DUE),
        state: d.status === 'decided' ? ('done' as const) : ('open' as const),
        paused: false,
        completedAt: d.decision?.at,
        actionRoute: `/partner-exit/${exit.partnerId}`,
        oversightRoute: `/partner-exit/${exit.partnerId}`,
      })));
    },
  },
  {
    // An AMC term about to end: Admin makes sure it is renewed (139), a month before, so the servicing never has a gap.
    kind: 'amc_renewal_review',
    nudgeBefore: days(7),
    escalateAfter: days(3),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.warranties.flatMap((w) =>
        (w.amc?.status === 'active' ? w.amc.terms : []).map((t) => {
          const job = src.jobs.find((j) => j.id === w.jobId);
          const later = (w.amc?.terms ?? []).some((x) => x.n > t.n);
          return {
            ...base('amc_renewal_review', 'job', `${w.jobId}:${t.n}`),
            ownerUserId: admin,
            titleKey: 'work.title.amc_renewal_review',
            titleParams: { code: job?.code ?? '', site: job?.siteName ?? '', date: t.endsOn },
            dueAt: new Date(new Date(`${t.endsOn}T00:00:00`).getTime() - 30 * 86_400_000).toISOString(),
            state: later ? ('done' as const) : ('open' as const),
            paused: false,
            actionRoute: `/warranty/${w.jobId}`,
            oversightRoute: `/warranty/${w.jobId}`,
          };
        }),
      );
    },
  },
  {
    // When the inspector finds the lift is not as it was logged, the installer explains it within a day (132): as-built records matter.
    kind: 'qc_finding_explain',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      return src.qcFindings.flatMap((f) => {
        const job = src.jobs.find((j) => j.id === f.jobId);
        if (!job?.technicianId) return [];
        return [
          {
            ...base('qc_finding_explain', 'qc_finding', f.id),
            ownerUserId: job.technicianId,
            titleKey: 'work.title.qc_finding_explain',
            titleParams: { code: job.code, item: f.itemId },
            dueAt: plus(f.raisedAt, hours(24)),
            state: f.explanation ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: f.explanation?.at,
            actionRoute: `/qc-mechanical/${f.jobId}`,
            oversightRoute: `/qc-mechanical/${f.jobId}`,
          },
        ];
      });
    },
  },
  {
    // A note left for the next person on the job is read and acknowledged within half a day (130): what was left half done, and where the key is,
    // is the sort of thing that goes wrong when nobody is sure it was seen.
    kind: 'handoff_acknowledge',
    nudgeBefore: hours(2),
    escalateAfter: hours(6),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      return src.handoffNotes.flatMap((h) => {
        const job = src.jobs.find((j) => j.id === h.jobId);
        if (!job || !h.ownerId || job.status === 'completed') return [];
        const done = h.toUserId ? h.acknowledgedBy.some((a) => a.userId === h.toUserId) : h.acknowledgedBy.length > 0;
        return [
          {
            ...base('handoff_acknowledge', 'handoff', h.id),
            ownerUserId: h.ownerId,
            titleKey: 'work.title.handoff_acknowledge',
            titleParams: { code: job.code, name: h.fromName },
            dueAt: plus(h.createdAt, hours(12)),
            state: done ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: h.acknowledgedBy[0]?.at,
            actionRoute: `/job-team/${job.id}?tab=handoffs`,
            oversightRoute: `/job-team/${job.id}?tab=handoffs`,
          },
        ];
      });
    },
  },
  {
    // With more than one person on a job the lead has the last word: once everything is done it is theirs to sign off for quality check (130).
    kind: 'lead_signoff',
    nudgeBefore: hours(2),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      return src.leadSignOffs.flatMap((w) => {
        const job = src.jobs.find((j) => j.id === w.jobId);
        if (!job) return [];
        return [
          {
            ...base('lead_signoff', 'job', w.jobId),
            ownerUserId: w.ownerId,
            titleKey: 'work.title.lead_signoff',
            titleParams: { code: job.code, site: job.siteName },
            dueAt: plus(w.doneAt, hours(12)),
            state: 'open' as const,
            paused: false,
            actionRoute: `/job-team/${job.id}`,
            oversightRoute: `/job-team/${job.id}`,
          },
        ];
      });
    },
  },
  {
    // What was actually put in the lift is written down and confirmed by the lead technician within two days of the work being done (128):
    // the warranty and AMC record is only as accurate as this. It is chased on the technician and, past its window, reaches Admin.
    kind: 'material_log_confirm',
    nudgeBefore: hours(6),
    escalateAfter: hours(24),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.jobs
        .filter((j) => (j.status === 'qc_pending' || j.status === 'handover_pending' || j.status === 'completed') && j.technicianId)
        .flatMap((j) => {
          const log = src.materialLogs.find((l) => l.jobId === j.id);
          const finishedAt = j.completedAt ?? j.steps.map((s) => s.completedAt).filter((x): x is string => !!x).sort().pop() ?? j.startedAt;
          if (!finishedAt) return [];
          const confirmed = log?.status === 'confirmed';
          // A job with no order lines has no plan to log against, and work finished long before the log existed is history.
          if (!confirmed && Date.now() - new Date(finishedAt).getTime() > days(45)) return [];
          return [
            {
              ...base('material_log_confirm', 'material_log', j.id),
              ownerUserId: j.technicianId as string,
              titleKey: 'work.title.material_log_confirm',
              titleParams: { code: j.code, site: j.siteName },
              dueAt: plus(finishedAt, hours(48)),
              state: confirmed ? ('done' as const) : ('open' as const),
              paused: false,
              completedAt: log?.confirmedAt,
              actionRoute: `/material-usage/${j.id}`,
              oversightRoute: `/material-usage/${j.id}`,
            },
          ];
        })
        .map((c) => ({ ...c, ...(c.ownerUserId ? {} : { ownerUserId: admin }) }));
    },
  },
  {
    // A wrong or missing part is reported the moment it is found (103). Admin owns
    // judging whose fault it was and getting it put right (108); a rush order is
    // chased in hours, not a day.
    kind: 'discrepancy_report_review',
    nudgeBefore: hours(2),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'quality',
    collect(src) {
      const admin = adminId(src);
      return src.discrepancyReports
        // A report from before delivery checks were kept here (no checklist) is history, not something to chase.
        .filter((r) => r.status !== 'withdrawn' && r.checklistId)
        .map((r) => {
          const po = src.purchaseOrders.find((p) => p.id === r.poId);
          const deal = src.deals.find((d) => d.id === r.dealId);
          const site = src.leads.find((l) => l.id === deal?.leadId)?.siteName ?? '';
          const settled = r.status === 'resolved' || (!!r.attribution && r.resolution !== 'reported');
          return {
            ...base('discrepancy_report_review', 'delivery', r.id),
            ownerUserId: admin,
            titleKey: 'work.title.discrepancy_report_review',
            titleParams: { code: r.code, site, po: po?.code ?? '' },
            dueAt: plus(r.createdAt, r.rush ? hours(4) : hours(24)),
            state: settled ? ('done' as const) : ('open' as const),
            paused: false,
            completedAt: settled ? (r.events.filter((e) => e.kind === 'resolution' || e.kind === 'attributed').map((e) => e.at).sort().pop() ?? r.createdAt) : undefined,
            actionRoute: `/damaged-parts?report=${r.id}`,
            oversightRoute: `/damaged-parts?report=${r.id}`,
          };
        });
    },
  },
  {
    // A carrier whose live tracking is down leaves every delivery of theirs on milestones only (109).
    // Admin owns getting it fixed; the deliveries carry on meanwhile, so it is a day, not an emergency.
    kind: 'partner_feed_restore',
    nudgeBefore: hours(4),
    escalateAfter: hours(12),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      return src.deliveryPartners
        .filter((p) => p.feedStatus === 'outage' && p.feedBrokenSince)
        .map((p) => ({
          ...base('partner_feed_restore', 'delivery_partner', `${p.id}:${p.feedBrokenSince}`),
          ownerUserId: admin,
          titleKey: 'work.title.partner_feed_restore',
          titleParams: { partner: p.name },
          dueAt: plus(p.feedBrokenSince!, hours(24)),
          state: 'open' as const,
          paused: false,
          actionRoute: `/delivery-partners?partner=${p.id}`,
          oversightRoute: `/delivery-partners?partner=${p.id}`,
        }));
    },
  },
  {
    // A supplier payment that has fallen due is Admin's to approve or hold (111). Approving is the last human
    // step before money moves, so an unanswered one is chased, then becomes an Alert like any other stuck promise.
    kind: 'supplier_payment_approve',
    nudgeBefore: hours(12),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: true,
    alertCategory: 'payment',
    collect(src) {
      const admin = adminId(src);
      const out: Obligation[] = [];
      for (const p of src.supplierPayments) {
        // Payments made before approval was kept here are history, not something anyone was ever chased for.
        if (p.status !== 'pending_approval' && !p.id.startsWith('spay-new-')) continue;
        const po = src.purchaseOrders.find((x) => x.id === p.poId);
        const supplier = src.suppliers.find((x) => x.id === p.supplierId);
        const acted = p.status !== 'pending_approval';
        out.push({
          ...base('supplier_payment_approve', 'supplier_payment', p.id),
          ownerUserId: admin,
          titleKey: 'work.title.supplier_payment_approve',
          titleParams: { supplier: supplier?.name ?? '', code: po?.code ?? '' },
          amount: p.amount,
          dueAt: plus(p.triggeredAt, days(2)),
          state: acted ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: acted ? (p.heldAt ?? p.approvedAt) : undefined,
          actionRoute: `/supplier-payments?payment=${p.id}`,
          oversightRoute: `/supplier-payments?payment=${p.id}`,
        });
      }
      return out;
    },
  },
  {
    // "Not yet" is a decision with a reason, not a place to lose money owed. A held payment comes back.
    kind: 'supplier_payment_hold_review',
    nudgeBefore: days(1),
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const admin = adminId(src);
      return src.supplierPayments
        .filter((p) => p.heldAt && p.id.startsWith('spay-new-'))
        .map((p) => {
          const po = src.purchaseOrders.find((x) => x.id === p.poId);
          const supplier = src.suppliers.find((x) => x.id === p.supplierId);
          const held = p.status === 'held';
          return {
            ...base('supplier_payment_hold_review', 'supplier_payment', p.id),
            ownerUserId: admin,
            titleKey: 'work.title.supplier_payment_hold_review',
            titleParams: { supplier: supplier?.name ?? '', code: po?.code ?? '' },
            amount: p.amount,
            dueAt: plus(p.heldAt!, days(7)),
            state: held ? ('open' as const) : ('done' as const),
            paused: false,
            completedAt: held ? undefined : (p.events.filter((e) => e.kind === 'hold_released' || e.kind === 'approved').map((e) => e.at).sort().pop() ?? p.heldAt),
            actionRoute: `/supplier-payments?payment=${p.id}`,
            oversightRoute: `/supplier-payments?payment=${p.id}`,
          };
        });
    },
  },
  {
    // Chasing back an advance for goods that never came is never left to age (118): a recovery that goes quiet is chased.
    kind: 'advance_recovery_followup',
    nudgeBefore: days(1),
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: true,
    alertCategory: 'payment',
    collect(src) {
      const admin = adminId(src);
      return src.advanceRecoveries.map((r) => {
        const supplier = src.suppliers.find((x) => x.id === r.supplierId);
        const po = src.purchaseOrders.find((x) => x.id === r.poId);
        const last = r.events[r.events.length - 1]?.at ?? r.startedAt;
        return {
          ...base('advance_recovery_followup', 'advance_recovery', r.id),
          ownerUserId: admin,
          titleKey: 'work.title.advance_recovery_followup',
          titleParams: { supplier: supplier?.name ?? '', code: po?.code ?? '' },
          amount: r.amount - r.recoveredAmount,
          dueAt: plus(last, RECOVERY_CHASE_EVERY),
          state: r.status === 'open' ? ('open' as const) : ('done' as const),
          paused: false,
          completedAt: r.closedAt,
          actionRoute: `/advance-retention?advance=${r.paymentId}`,
          oversightRoute: `/advance-retention?advance=${r.paymentId}`,
        };
      });
    },
  },
  {
    // A mismatch between the bank and the books is Admin's until it is explained or the records catch up. A payment made twice is
    // owed an answer the same day; a bank fee can wait a week, and does not raise an alert of its own (120).
    kind: 'reconciliation_exception_review',
    nudgeBefore: hours(6),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const admin = adminId(src);
      return src.reconciliationExceptions.map((e) => ({
        ...base('reconciliation_exception_review', 'reconciliation_exception', e.id),
        ownerUserId: admin,
        titleKey: 'work.title.reconciliation_exception_review',
        titleParams: { party: e.counterparty },
        amount: e.amount,
        dueAt: plus(e.firstSeenAt, REVIEW_DUE[severityOf(e.kind, e.amount, e.difference)]),
        state: e.status === 'open' ? ('open' as const) : ('done' as const),
        paused: false,
        completedAt: e.reconciled?.at ?? e.clearedAt,
        actionRoute: `/reconciliation?exception=${e.id}`,
        oversightRoute: `/reconciliation?exception=${e.id}`,
      }));
    },
  },
  {
    // With the bank connection down a reconciliation cannot run at all, so the day's check is silently not happening (120).
    kind: 'reconciliation_feed_restore',
    nudgeBefore: hours(4),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      if (src.bankFeed.status !== 'unavailable') return [];
      return [
        {
          ...base('reconciliation_feed_restore', 'bank_feed', 'bank-feed'),
          ownerUserId: adminId(src),
          titleKey: 'work.title.reconciliation_feed_restore',
          titleParams: {},
          dueAt: plus(src.bankFeed.since, FEED_RESTORE_DUE),
          state: 'open' as const,
          paused: false,
          actionRoute: '/reconciliation',
          oversightRoute: '/reconciliation',
        },
      ];
    },
  },
  {
    // A retention whose installation has cleared QC and been handed over is Admin's to release: money held back is not kept a day longer than it has to be (118).
    kind: 'retention_release_ready',
    nudgeBefore: days(1),
    escalateAfter: days(3),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const admin = adminId(src);
      return src.retentionsReady.map((r) => ({
        ...base('retention_release_ready', 'supplier_retention', r.retentionId),
        ownerUserId: admin,
        titleKey: 'work.title.retention_release_ready',
        titleParams: { supplier: r.supplierName, code: r.poCode },
        amount: r.amount,
        dueAt: plus(r.readyAt, RELEASE_DUE_AFTER),
        state: 'open' as const,
        paused: false,
        actionRoute: '/advance-retention?tab=retentions',
        oversightRoute: '/advance-retention?tab=retentions',
      }));
    },
  },
  {
    // A supplier who disagrees with a payment is owed an answer, and one who says it may stop taking orders is owed it sooner (117).
    // Each time round is its own obligation, so a decision the supplier contests puts a fresh clock on Admin.
    kind: 'supplier_dispute_resolve',
    nudgeBefore: hours(12),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: true,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      return src.supplierDisputes.map((d) => {
        const supplier = src.suppliers.find((x) => x.id === d.supplierId);
        const po = src.purchaseOrders.find((x) => x.id === d.poId);
        return {
          ...base('supplier_dispute_resolve', 'supplier_dispute', `${d.id}:r${d.round}`),
          ownerUserId: admin,
          titleKey: 'work.title.supplier_dispute_resolve',
          titleParams: { supplier: supplier?.name ?? '', code: po?.code ?? '' },
          amount: d.claimedAmount ?? undefined,
          dueAt: dueAtOf(d.roundStartedAt, d.threatensHalt),
          state: d.status === 'resolved' ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: d.status === 'resolved' ? d.decisions[d.decisions.length - 1]?.at : undefined,
          actionRoute: `/supplier-disputes?dispute=${d.id}`,
          oversightRoute: `/supplier-disputes?dispute=${d.id}`,
        };
      });
    },
  },
  {
    // A dispute that showed a flaw in AIEC's own process is only worth something if the process is then fixed (117).
    kind: 'supplier_dispute_process_review',
    nudgeBefore: days(2),
    escalateAfter: days(3),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      return src.supplierDisputes
        .filter((d) => !!d.processFlag)
        .map((d) => ({
          ...base('supplier_dispute_process_review', 'supplier_dispute', d.id),
          ownerUserId: admin,
          titleKey: 'work.title.supplier_dispute_process_review',
          titleParams: { code: d.code },
          dueAt: plus(d.processFlag!.at, PROCESS_REVIEW_TARGET),
          state: d.processFlag!.status === 'addressed' ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: d.processFlag!.addressedAt,
          actionRoute: `/supplier-disputes?dispute=${d.id}`,
          oversightRoute: `/supplier-disputes?dispute=${d.id}`,
        }));
    },
  },
  {
    // A month's GST figures are owed to the accountant by the 7th of the next month, ahead of the returns due on the 20th (116).
    kind: 'gst_period_handover',
    nudgeBefore: days(1),
    escalateAfter: days(3),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const admin = adminId(src);
      return src.gstPeriods.map((g) => ({
        ...base('gst_period_handover', 'gst_period', g.period),
        ownerUserId: admin,
        titleKey: 'work.title.gst_period_handover',
        titleParams: { period: g.period },
        dueAt: handoverDueAt(g.period),
        state: g.handedOver ? ('done' as const) : ('open' as const),
        paused: false,
        completedAt: g.handedOverAt,
        actionRoute: `/gst-compliance?period=${g.period}`,
        oversightRoute: `/gst-compliance?period=${g.period}`,
      }));
    },
  },
  {
    // A supplier's GST standing can lapse at any time and put credit already assumed in doubt, so it is looked up again every month (116).
    kind: 'gst_status_check',
    nudgeBefore: days(3),
    escalateAfter: days(5),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const admin = adminId(src);
      return src.gstStatusChecks.map((c) => {
        const later = c.lastCheckedAt !== null && Date.now() - new Date(c.lastCheckedAt).getTime() <= CHECK_STALE_AFTER;
        return {
          ...base('gst_status_check', 'supplier_gst', c.supplierId),
          ownerUserId: admin,
          titleKey: 'work.title.gst_status_check',
          titleParams: { supplier: c.name },
          dueAt: plus(c.lastCheckedAt ?? c.since, CHECK_STALE_AFTER),
          state: later ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: later ? (c.lastCheckedAt ?? undefined) : undefined,
          actionRoute: `/gst-compliance?supplier=${c.supplierId}`,
          oversightRoute: `/gst-compliance?supplier=${c.supplierId}`,
        };
      });
    },
  },
  {
    // Delivery is confirmed but the supplier has not billed for it (113). Nothing can be paid on a missing document, so the
    // supplier owes the invoice, or Admin does by proxy when they have no login, and it is chased before the payment is.
    kind: 'supplier_invoice_submit',
    nudgeBefore: hours(12),
    escalateAfter: days(1),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const admin = adminId(src);
      const out: Obligation[] = [];
      for (const g of src.invoiceGates) {
        const po = src.purchaseOrders.find((x) => x.id === g.poId);
        if (!po || isOrphaned(src, po)) continue;
        const supplier = src.suppliers.find((s) => s.id === g.supplierId);
        const portalUser = supplierUser(src, g.supplierId);
        const done = g.gate !== 'no_invoice' && g.gate !== 'incomplete';
        out.push({
          ...base('supplier_invoice_submit', 'purchase_order', po.id),
          ownerUserId: portalUser?.id ?? admin,
          titleKey: portalUser ? 'work.title.supplier_invoice_submit' : 'work.title.supplier_invoice_submit_proxy',
          titleParams: { code: po.code, supplier: supplier?.name ?? '' },
          dueAt: plus(g.deliveredAt, days(3)),
          state: done ? ('done' as const) : ('open' as const),
          paused: false,
          completedAt: done ? g.deliveredAt : undefined,
          actionRoute: '/supplier-invoices?po=' + po.id,
          oversightRoute: '/supplier-invoices?po=' + po.id,
        });
      }
      return out;
    },
  },
  {
    // An invoice that does not match the order or the delivery goes to reconciliation, never quietly through (113).
    kind: 'supplier_invoice_mismatch_review',
    nudgeBefore: hours(12),
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'payment',
    collect(src) {
      const admin = adminId(src);
      return src.invoiceMismatches.map((m) => {
        const po = src.purchaseOrders.find((x) => x.id === m.poId);
        const supplier = src.suppliers.find((s) => s.id === m.supplierId);
        return {
          ...base('supplier_invoice_mismatch_review', 'supplier_invoice', m.invoiceId),
          ownerUserId: admin,
          titleKey: 'work.title.supplier_invoice_mismatch_review',
          titleParams: { number: m.invoiceNumber, supplier: supplier?.name ?? '', code: po?.code ?? '' },
          dueAt: plus(m.notifiedAt, days(3)),
          state: m.stillMismatched ? ('open' as const) : ('done' as const),
          paused: false,
          completedAt: m.stillMismatched ? undefined : m.resolvedAt ?? m.notifiedAt,
          actionRoute: `/supplier-invoices?invoice=${m.invoiceId}`,
          oversightRoute: `/supplier-invoices?invoice=${m.invoiceId}`,
        };
      });
    },
  },
  {
    // Where a vehicle with no live feed is, is only what its supplier says.
    // Until it arrives, the supplier owes an update every few hours — and a
    // live vehicle whose feed dropped falls back to the same promise.
    kind: 'shipment_status_update',
    nudgeBefore: hours(1),
    escalateAfter: hours(3),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'supplier',
    collect(src) {
      const admin = adminId(src);
      const out: Obligation[] = [];
      for (const leg of src.shipmentLegs) {
        const needsWords = leg.source === 'manual' || (!!leg.feedLostAt && new Date(leg.feedLostAt).getTime() <= src.now);
        if (!needsWords) continue;
        const po = src.purchaseOrders.find((p) => p.id === leg.poId);
        const supplier = src.suppliers.find((s) => s.id === leg.supplierId);
        // A carrier booked by AIEC has no login: Admin asks them, so the supplier is never chased for a truck that is not theirs.
        const partner = leg.partnerId ? src.deliveryPartners.find((p) => p.id === leg.partnerId) : undefined;
        const portalUser = partner ? undefined : supplierUser(src, leg.supplierId);
        const arrived = leg.milestones.find((e) => e.milestone === 'arrived');
        const lastWord = leg.milestones.filter((e) => e.source === 'manual').map((e) => e.at).sort().pop() ?? leg.feedLostAt ?? leg.dispatchedAt;
        out.push({
          ...base('shipment_status_update', 'shipment', leg.id),
          ownerUserId: portalUser?.id ?? admin,
          titleKey: portalUser ? 'work.title.shipment_status_update' : 'work.title.shipment_status_update_proxy',
          titleParams: { code: po?.code ?? '', supplier: partner?.name ?? supplier?.name ?? '' },
          dueAt: plus(lastWord, MANUAL_UPDATE_EVERY),
          state: arrived ? 'done' : 'open',
          paused: false,
          completedAt: arrived?.at,
          actionRoute: `/shipments?leg=${leg.id}`,
          oversightRoute: `/shipments?leg=${leg.id}`,
        });
      }
      return out;
    },
  },
  {
    kind: 'alert_acknowledge',
    nudgeBefore: 0,
    escalateAfter: hours(1),
    escalates: true,
    // The subject already is an Alert — escalating it into another would loop.
    raisesAlert: false,
    alertCategory: 'sla_breach',
    collect(src) {
      const admin = adminId(src);
      return src.alerts.map((alert) => {
        // Handed to someone else on 029: they own it while they are active; it comes back to Admin otherwise.
        const delegate = activeUser(src, alert.delegatedToUserId);
        return {
          ...base('alert_acknowledge', 'alert', alert.id),
          ownerUserId: delegate?.id ?? admin,
          titleKey: 'work.title.alert_acknowledge',
          titleParams: { code: alert.code, context: alert.context },
          dueAt: plus(alert.raisedAt, ALERT_ACK_WINDOW[alert.severity]),
          state: alert.status === 'open' ? ('open' as const) : ('done' as const),
          // A snooze pauses the reminder, never the alert: the escalation matrix (184) still walks a critical one.
          paused: !!alert.snoozedUntil && Date.parse(alert.snoozedUntil) > src.now,
          completedAt: alert.resolvedAt,
          actionRoute: delegate && delegate.role !== 'admin' ? alert.sourceRoute ?? '/admin/alerts' : alert.severity === 'critical' || alert.severity === 'high' ? '/admin/escalations' : '/admin/alerts',
          oversightRoute: alert.sourceRoute ?? '/admin/alerts',
        };
      });
    },
  },
  {
    kind: 'follow_up_task',
    nudgeBefore: hours(4),
    escalateAfter: days(2),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'sla_breach',
    quickAction: 'complete_task',
    collect(src) {
      const out: Obligation[] = [];
      for (const task of src.followUpTasks) {
        const owner = activeUser(src, task.assignedTo);
        if (!owner) continue;
        const lead = src.leads.find((l) => l.id === task.leadId);
        out.push({
          ...base('follow_up_task', 'follow_up_task', task.id),
          ownerUserId: owner.id,
          titleKey: 'work.title.follow_up_task',
          titleParams: { title: task.title, site: lead?.siteName ?? '' },
          dueAt: task.dueDate,
          state: task.status === 'open' ? 'open' : task.status === 'done' ? 'done' : 'cancelled',
          paused: false,
          completedAt: task.completedAt,
          actionRoute: routeFor(owner, '/admin/leads/follow-ups'),
          oversightRoute: '/admin/leads/follow-ups',
        });
      }
      return out;
    },
  },
  {
    kind: 'lead_revisit',
    nudgeBefore: days(1),
    escalateAfter: days(7),
    escalates: true,
    raisesAlert: false,
    alertCategory: 'sla_breach',
    collect(src) {
      return src.leads
        .filter((lead) => lead.revisitReminderDate && lead.markedLostAt)
        .map((lead) => {
          const owner = leadOwner(src, lead);
          return {
            ...base('lead_revisit', 'lead', lead.id),
            ownerUserId: owner?.id ?? adminId(src),
            titleKey: 'work.title.lead_revisit',
            titleParams: { site: lead.siteName, name: lead.contactName },
            amount: lead.estimatedValue,
            dueAt: lead.revisitReminderDate!,
            state: lead.stage === 'lost' ? ('open' as const) : ('done' as const),
            paused: false,
            completedAt: lead.stage === 'lost' ? undefined : lead.stageEnteredAt,
            actionRoute: routeFor(owner, `/admin/leads/${lead.id}`),
            oversightRoute: `/admin/leads/${lead.id}`,
          };
        });
    },
  },
];

export const RULE_BY_KIND = Object.fromEntries(COMMITMENT_RULES.map((r) => [r.kind, r])) as Record<
  CommitmentKind,
  CommitmentRule
>;

/** Every obligation the rules can see right now. */
export function collectObligations(src: CommitmentSources): Obligation[] {
  return COMMITMENT_RULES.flatMap((rule) => rule.collect(src));
}

/**
 * The highest rung this commitment has earned by `now`. Pure, so the engine
 * can compare it against the rung already reached and act only on the gap.
 */
export function targetEscalationLevel(
  rule: CommitmentRule,
  dueAt: string,
  now: number,
  ownerIsTopOfChain: boolean,
): 0 | 1 | 2 | 3 | 4 {
  const due = new Date(dueAt).getTime();
  if (rule.escalates && now >= due + 2 * rule.escalateAfter && rule.raisesAlert && !ownerIsTopOfChain) return 4;
  if (rule.escalates && now >= due + rule.escalateAfter) return 3;
  if (now >= due) return 2;
  if (rule.nudgeBefore > 0 && now >= due - rule.nudgeBefore) return 1;
  return 0;
}
