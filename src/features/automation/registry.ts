/**
 * Every automation the system runs on its own clock, and the category each belongs to (181). Pure metadata: the heartbeat in the repository reads it, and so do the dashboard
 * and the Automation Health Monitor, so they cannot disagree about what exists. A category nobody has listed here still appears: it is made from the name of whatever
 * automated action turned up (`categoryOfSource`), so a feature shipped later shows on the dashboard without a change to a fixed list.
 */

export interface CategoryDef {
  id: string;
  /** English name, for the places that print one as plain text (a commitment title); the screen translates its own labels. */
  name: string;
  /** Where this category is configured (its own contextual home). */
  route: string | null;
  /** True when pausing it would stop people being reminded of their own promises (including the reminder to resume anything that was paused): it cannot be paused. */
  protected?: boolean;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'communications', name: 'Communications', route: '/admin/comm/trigger-rules' },
  { id: 'payments', name: 'Payments', route: '/admin/analytics/collections/reminders' },
  { id: 'finance', name: 'Finance', route: '/reconciliation' },
  { id: 'suppliers', name: 'Suppliers', route: '/admin/suppliers/po-rules' },
  { id: 'logistics', name: 'Logistics', route: '/delivery-delays' },
  { id: 'field', name: 'Field work', route: '/admin/alerts' },
  { id: 'quality', name: 'Quality', route: '/qc-assignments' },
  { id: 'training', name: 'Training', route: '/training-compliance' },
  { id: 'recruitment', name: 'Recruitment', route: '/recruitment' },
  { id: 'payouts', name: 'Partner payouts', route: '/payout-disbursement' },
  { id: 'rewards', name: 'Rewards', route: '/contest-setup' },
  { id: 'customerCare', name: 'Customer care', route: '/service-requests' },
  { id: 'custom', name: 'Custom rules', route: '/workflow-rules' },
  { id: 'commitments', name: 'Follow-ups', route: '/admin/escalations', protected: true },
];

export interface UnitDef { id: string; category: string; name: string; route?: string }

/** One entry per step of the heartbeat. `name` is plain English because the Health Monitor prints a rule's name as it is. */
export const UNITS: UnitDef[] = [
  { id: 'customRules', category: 'custom', name: 'Custom rules' },
  { id: 'escalationMatrix', category: 'commitments', name: 'Escalation matrix' },
  { id: 'slaMonitor', category: 'commitments', name: 'SLA breach monitor' },
  { id: 'integrationHealth', category: 'commitments', name: 'Integration health checks' },
  { id: 'auditChain', category: 'commitments', name: 'Audit log integrity check' },
  { id: 'overridePatterns', category: 'commitments', name: 'Manual override patterns' },
  { id: 'integrationManagement', category: 'commitments', name: 'Credential rotation and test-mode checks' },
  { id: 'companyProfile', category: 'commitments', name: 'Company profile changes taking effect' },
  { id: 'permissions', category: 'commitments', name: 'Access exceptions reaching their end' },
  { id: 'privacy', category: 'commitments', name: 'Retention policy and data request deadlines' },
  { id: 'security', category: 'commitments', name: 'Session limits, second-step exceptions and recovery codes' },
  { id: 'billing', category: 'commitments', name: 'Service renewals, failed payments and card expiry' },
  { id: 'appInfo', category: 'customerCare', name: 'Suggestions about the app that nobody has looked at yet' },
  { id: 'help', category: 'customerCare', name: 'Help articles that are wrong or out of date, and suggested help topics' },
  { id: 'legal', category: 'commitments', name: 'Legal wording that takes effect, legal review findings and states with no wording yet' },
  { id: 'backups', category: 'commitments', name: 'Scheduled backups, retries, restore-point alerts and export files' },
  { id: 'followUpTasks', category: 'commitments', name: 'Follow-up task reconciliation' },
  { id: 'paymentReminders', category: 'payments', name: 'Payment reminders' },
  { id: 'scheduledQuotations', category: 'communications', name: 'Scheduled quotation sends' },
  { id: 'autoDraftPurchaseOrders', category: 'suppliers', name: 'Automatic purchase order drafts' },
  { id: 'productionStalls', category: 'suppliers', name: 'Production stall detection' },
  { id: 'retentions', category: 'suppliers', name: 'Supplier retention release' },
  { id: 'partnerFeeds', category: 'logistics', name: 'Carrier tracking feeds' },
  { id: 'supplierPayments', category: 'suppliers', name: 'Supplier payments due' },
  { id: 'supplierPaymentExecution', category: 'suppliers', name: 'Supplier payment execution' },
  { id: 'paymentAnomalies', category: 'suppliers', name: 'Supplier payment sequence checks' },
  { id: 'invoiceMismatches', category: 'suppliers', name: 'Supplier invoice mismatches' },
  { id: 'gstCompliance', category: 'finance', name: 'GST standing checks' },
  { id: 'supplierDisputes', category: 'suppliers', name: 'Supplier dispute clocks' },
  { id: 'supplierReviewFlags', category: 'suppliers', name: 'Supplier review flags' },
  { id: 'reconciliation', category: 'finance', name: 'Daily bank reconciliation' },
  { id: 'fieldSos', category: 'field', name: 'Field SOS dispatch' },
  { id: 'technicianClashes', category: 'field', name: 'Technician schedule clashes' },
  { id: 'recruitmentIntake', category: 'recruitment', name: 'Recruitment intake surge' },
  { id: 'partnerExits', category: 'recruitment', name: 'Partner exits' },
  { id: 'assessmentAlerts', category: 'training', name: 'Assessment coaching flags' },
  { id: 'certifications', category: 'training', name: 'Certification lapses' },
  { id: 'refreshers', category: 'training', name: 'Refresher reminders' },
  { id: 'compliance', category: 'training', name: 'Training compliance snapshot' },
  { id: 'sopRollouts', category: 'training', name: 'Procedure rollout follow-up' },
  { id: 'trainingFeedback', category: 'training', name: 'Training feedback flags' },
  { id: 'payoutSpikes', category: 'payouts', name: 'Payout spike detection' },
  { id: 'disbursements', category: 'payouts', name: 'Partner payout runs' },
  { id: 'tds', category: 'payouts', name: 'Tax deduction obligations' },
  { id: 'payoutDisputes', category: 'payouts', name: 'Payout dispute updates' },
  { id: 'serviceTickets', category: 'customerCare', name: 'Service request clocks' },
  { id: 'supportChats', category: 'customerCare', name: 'Support chat queue' },
  { id: 'contests', category: 'rewards', name: 'Contest lifecycle' },
  { id: 'badges', category: 'rewards', name: 'Badge awards' },
  { id: 'partnerInterviews', category: 'recruitment', name: 'Interview reminders' },
  { id: 'verification', category: 'recruitment', name: 'Partner verification checks' },
  { id: 'offers', category: 'recruitment', name: 'Partner offer nudges' },
  { id: 'safetyAlerts', category: 'field', name: 'Safety check holds' },
  { id: 'issueAlerts', category: 'field', name: 'Site problem reports' },
  { id: 'materialDeviations', category: 'field', name: 'Material deviation patterns' },
  { id: 'teamAlerts', category: 'field', name: 'Job team disagreements' },
  { id: 'qcAssignments', category: 'quality', name: 'Inspector independence checks' },
  { id: 'qcMechAlerts', category: 'quality', name: 'Mechanical check failures' },
  { id: 'qcElecAlerts', category: 'quality', name: 'Electrical check failures' },
  { id: 'snagAlerts', category: 'quality', name: 'Snag follow-up' },
  { id: 'warrantyReminders', category: 'customerCare', name: 'Warranty and service plan reminders' },
  { id: 'leadDelegations', category: 'field', name: 'Lead delegation expiry' },
  { id: 'issueHolds', category: 'field', name: 'Job holds from site reports' },
  { id: 'sopHandoff', category: 'field', name: 'Hand-over to quality check' },
  { id: 'advanceExposure', category: 'suppliers', name: 'Supplier advance exposure' },
  { id: 'shipments', category: 'logistics', name: 'Shipment milestones' },
  { id: 'delayCases', category: 'logistics', name: 'Delivery delay cases' },
  { id: 'stageInvoices', category: 'payments', name: 'Stage invoice backfill' },
  { id: 'commitments', category: 'commitments', name: 'Commitment sync' },
  { id: 'escalations', category: 'commitments', name: 'Escalation ladder' },
];

const unitById = new Map(UNITS.map((u) => [u.id, u]));
export const unitDef = (id: string): UnitDef | undefined => unitById.get(id);
export const isProtectedUnit = (id: string): boolean => !!categoryDef(unitById.get(id)?.category ?? '')?.protected;
export const categoryDef = (id: string): CategoryDef | undefined => CATEGORIES.find((c) => c.id === id);

/** The legacy rules the Health Monitor has always listed, by the kind of thing they do. */
const RULE_CATEGORY: Record<string, string> = { 'a-1': 'communications', 'a-2': 'communications', 'a-3': 'payments', 'a-4': 'field', 'a-5': 'commitments', 'a-6': 'suppliers', 'a-7': 'communications', 'a-8': 'payouts', 'a-9': 'suppliers' };
export function categoryOfRule(rule: { id: string }): string {
  if (rule.id.startsWith('u:')) return unitById.get(rule.id.slice(2))?.category ?? 'other';
  return RULE_CATEGORY[rule.id] ?? 'other';
}

/** Which category an automated action belongs to, from the first part of its source key. Unknown names become a category of their own. */
const SOURCE_CATEGORY: [RegExp, string][] = [
  [/^(quotation|followup|lead|welcome|template|sequence|comm|notification)/, 'communications'],
  [/^(payment_reminder|invoice|credit_note)/, 'payments'],
  [/^(gst|reconciliation|supplier_payment_analytics|bank)/, 'finance'],
  [/^(purchase_order|supplier|production|advance|retention|po)/, 'suppliers'],
  [/^(shipment|delivery|discrepancy)/, 'logistics'],
  [/^(installation|field_sos|technician|team|issues|materials|safety|site)/, 'field'],
  [/^(qc|snag|compliance_cert|handover)/, 'quality'],
  [/^(refresher|certification|assessment|compliance|sop_rollout|training_feedback|training)/, 'training'],
  [/^(partner|interview|verification|offer|recruitment|application)/, 'recruitment'],
  [/^(payout|tds|commission)/, 'payouts'],
  [/^(contest|badge|leaderboard)/, 'rewards'],
  [/^(service|support_chat|maintenance|feedback|warranty|referral)/, 'customerCare'],
  [/^custom_rule/, 'custom'],
  [/^(commitment|escalation|alert)/, 'commitments'],
];
export function categoryOfSource(sourceKey: string): string {
  const hit = SOURCE_CATEGORY.find(([re]) => re.test(sourceKey));
  if (hit) return hit[1];
  return sourceKey.split('.')[0] || 'other';
}

/** A readable name for a category nobody has named yet: `new_thing` becomes "New thing". */
export const categoryName = (id: string): string => categoryDef(id)?.name ?? humanise(id);
export const humanise = (id: string): string => { const s = id.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim(); return s.charAt(0).toUpperCase() + s.slice(1); };
