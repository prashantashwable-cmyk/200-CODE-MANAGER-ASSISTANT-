/**
 * Data privacy and consent (194): the purposes people consent to, the categories of data AIEC holds and how long each is kept, the way a request from a person about their own data is handled,
 * and what a deletion can and cannot remove. Pure: the screen and the repository judge with the same rules. Every period, limit and legal basis here is a placeholder for the owner's adviser to confirm.
 */
import { days as clockDays } from '@/features/sla/clock';

export type SubjectKind = 'customer' | 'partner' | 'former_partner' | 'applicant' | 'contact';
export const SUBJECT_KINDS: SubjectKind[] = ['customer', 'partner', 'former_partner', 'applicant', 'contact'];

export type Purpose = 'sms' | 'whatsapp' | 'recruitment_contact' | 'location_tracking';
export type ConsentStatus = 'granted' | 'withdrawn' | 'not_recorded';
export interface PurposeDef { id: Purpose; appliesTo: SubjectKind[] }
export const PURPOSES: PurposeDef[] = [
  { id: 'sms', appliesTo: ['customer', 'partner', 'applicant', 'contact', 'former_partner'] },
  { id: 'whatsapp', appliesTo: ['customer', 'partner', 'applicant', 'contact', 'former_partner'] },
  { id: 'recruitment_contact', appliesTo: ['applicant'] },
  { id: 'location_tracking', appliesTo: ['partner'] },
];
export const purposesFor = (kinds: SubjectKind[]): Purpose[] => PURPOSES.filter((p) => p.appliesTo.some((k) => kinds.includes(k))).map((p) => p.id);

export type RequestType = 'access' | 'correction' | 'deletion' | 'consent_withdrawal';
export const REQUEST_TYPES: RequestType[] = ['access', 'correction', 'deletion', 'consent_withdrawal'];
export type RequestStatus = 'received' | 'in_progress' | 'completed' | 'partially_completed' | 'refused' | 'withdrawn';
export const OPEN_STATUSES: RequestStatus[] = ['received', 'in_progress'];
export const isOpenRequest = (s: RequestStatus): boolean => OPEN_STATUSES.includes(s);
export const REQUEST_CHANNELS = ['phone', 'email', 'whatsapp', 'in_person', 'in_app', 'letter'] as const;
export type RequestChannel = (typeof REQUEST_CHANNELS)[number];
export const VERIFY_METHODS = ['call_back', 'otp', 'in_person', 'id_document'] as const;
export type VerifyMethod = (typeof VERIFY_METHODS)[number];

/** Placeholders for the owner to confirm. */
export const ACK_DAYS = 2;
export const RESPOND_DAYS = 30;
export const WARN_AT = 0.8;
export const NOTE_MIN = 10;
export const REFUSE_MIN = 20;
export const POLICY_MIN = 200;
export const MAX_RUN = 200;
export const POLICY_MAX_DAYS = 90;
export const RETENTION_MAX_DAYS = 90;
export const ackDueAt = (receivedAt: string): string => new Date(Date.parse(receivedAt) + clockDays(ACK_DAYS)).toISOString();
export const dueAtOf = (receivedAt: string): string => new Date(Date.parse(receivedAt) + clockDays(RESPOND_DAYS)).toISOString();
export type SlaState = 'on_track' | 'close' | 'late';
export function slaOf(receivedAt: string, closedAt: string | null, now: number): { state: SlaState; ratio: number; daysLeft: number } {
  const start = Date.parse(receivedAt);
  const end = closedAt ? Date.parse(closedAt) : now;
  const ratio = (end - start) / clockDays(RESPOND_DAYS);
  return { state: ratio >= 1 ? 'late' : ratio >= WARN_AT ? 'close' : 'on_track', ratio, daysLeft: Math.ceil((start + clockDays(RESPOND_DAYS) - now) / 86_400_000) };
}

export type CategoryGroup = 'people' | 'communication' | 'business' | 'money' | 'safety' | 'location';
export type RetentionAction = 'erase' | 'anonymise' | 'review' | 'retain';
export interface CategoryDef {
  id: string;
  group: CategoryGroup;
  /** The retention run of this build enforces the action itself; otherwise a person decides when records come due. */
  enforced: boolean;
  /** Kept for a legal reason that a deletion request cannot override (placeholder years, for the owner's adviser). */
  statutoryYears: number | null;
  defaultDays: number | null;
  defaultAction: RetentionAction;
}
export const CATEGORIES: CategoryDef[] = [
  { id: 'communications', group: 'communication', enforced: true, statutoryYears: null, defaultDays: 1095, defaultAction: 'anonymise' },
  { id: 'location_trail', group: 'location', enforced: true, statutoryYears: null, defaultDays: 90, defaultAction: 'erase' },
  { id: 'applicant_records', group: 'people', enforced: true, statutoryYears: null, defaultDays: 365, defaultAction: 'erase' },
  { id: 'prospect_records', group: 'business', enforced: false, statutoryYears: null, defaultDays: 1095, defaultAction: 'review' },
  { id: 'contracts_invoices', group: 'money', enforced: false, statutoryYears: 8, defaultDays: 2920, defaultAction: 'retain' },
  { id: 'payments_tax', group: 'money', enforced: false, statutoryYears: 8, defaultDays: 2920, defaultAction: 'retain' },
  { id: 'partner_payouts', group: 'money', enforced: false, statutoryYears: 8, defaultDays: 2920, defaultAction: 'retain' },
  { id: 'installation_safety', group: 'safety', enforced: false, statutoryYears: 10, defaultDays: 3650, defaultAction: 'retain' },
  { id: 'warranty_service', group: 'business', enforced: false, statutoryYears: null, defaultDays: 1825, defaultAction: 'review' },
  { id: 'partner_profile', group: 'people', enforced: false, statutoryYears: null, defaultDays: 1095, defaultAction: 'review' },
  { id: 'consent_records', group: 'people', enforced: false, statutoryYears: 7, defaultDays: 2555, defaultAction: 'retain' },
];
export const categoryDef = (id: string): CategoryDef | undefined => CATEGORIES.find((c) => c.id === id);
export interface RetentionRule { days: number | null; action: RetentionAction }
export type RetentionRules = Record<string, RetentionRule>;
export const defaultRules = (): RetentionRules => Object.fromEntries(CATEGORIES.map((c) => [c.id, { days: c.defaultDays, action: c.defaultAction }]));

export type RetentionProblem = 'unknown_category' | 'days_invalid' | 'below_statutory' | 'action_invalid' | 'enforced_needs_days' | 'no_change';
/** What stops a retention policy being saved: a period shorter than the law keeps a record for, an action this build cannot carry out, a missing period for something it enforces. */
export function retentionProblems(rules: RetentionRules, current: RetentionRules): RetentionProblem[] {
  const out = new Set<RetentionProblem>();
  let changed = false;
  for (const [id, r] of Object.entries(rules)) {
    const def = categoryDef(id);
    if (!def) { out.add('unknown_category'); continue; }
    if (r.days !== null && (!Number.isInteger(r.days) || r.days < 1 || r.days > 36_500)) out.add('days_invalid');
    if (!['erase', 'anonymise', 'review', 'retain'].includes(r.action)) out.add('action_invalid');
    if (def.statutoryYears !== null && (r.days === null || r.days < def.statutoryYears * 365)) out.add('below_statutory');
    if (def.statutoryYears !== null && (r.action === 'erase' || r.action === 'anonymise')) out.add('action_invalid');
    if (def.enforced && (r.action === 'erase' || r.action === 'anonymise') && r.days === null) out.add('enforced_needs_days');
    if (!def.enforced && (r.action === 'erase' || r.action === 'anonymise')) out.add('action_invalid');
    const cur = current[id];
    if (!cur || cur.days !== r.days || cur.action !== r.action) changed = true;
  }
  if (!changed) out.add('no_change');
  return [...out];
}

export type PlanAction = 'erase' | 'anonymise' | 'retain';
export type PlanReason = 'none' | 'statutory' | 'contract_active' | 'warranty_active' | 'safety_record' | 'consent_evidence' | 'unpaid' | 'person_decides' | 'former_partner_profile';
export interface PlanRow { category: string; count: number; action: PlanAction; reason: PlanReason; /** The day the reason stops applying, when it is a period. */ until: string | null; /** This build can carry the action out itself. */ executable: boolean }
export interface SubjectFacts {
  kind: SubjectKind;
  openWork: boolean;
  activeWarranty: boolean;
  unpaid: boolean;
  /** The date a statutory record last touched, for working out when its period ends. */
  lastMoneyAt: string | null;
  lastSafetyAt: string | null;
}
const plusYears = (iso: string | null, y: number | null): string | null => (iso && y !== null ? new Date(new Date(iso).setFullYear(new Date(iso).getFullYear() + y)).toISOString() : null);

/** What a deletion request can remove, what it cannot and why. Nothing is refused wholesale: the parts that can go, go; the parts a law or a live contract keeps are named with the reason and the day it ends. */
export function planDeletion(f: SubjectFacts, counts: Record<string, number>): PlanRow[] {
  const rows: PlanRow[] = [];
  for (const c of CATEGORIES) {
    const count = counts[c.id] ?? 0;
    if (count === 0) continue;
    let action: PlanAction = 'erase';
    let reason: PlanReason = 'none';
    let until: string | null = null;
    let executable = c.enforced || c.id === 'prospect_records';
    if (c.statutoryYears !== null) {
      action = 'retain'; executable = false;
      reason = c.id === 'installation_safety' ? 'safety_record' : c.id === 'consent_records' ? 'consent_evidence' : 'statutory';
      until = plusYears(c.id === 'installation_safety' ? f.lastSafetyAt : f.lastMoneyAt, c.statutoryYears);
    } else if (c.id === 'communications') {
      action = f.openWork || f.unpaid ? 'retain' : 'anonymise';
      reason = f.openWork ? 'contract_active' : f.unpaid ? 'unpaid' : 'none';
      executable = action === 'anonymise';
    } else if (c.id === 'prospect_records') {
      action = f.kind === 'customer' || f.openWork ? 'retain' : 'erase';
      reason = action === 'retain' ? 'contract_active' : 'none';
      executable = action === 'erase';
    } else if (c.id === 'warranty_service') {
      action = 'retain'; reason = f.activeWarranty ? 'warranty_active' : 'person_decides'; executable = false;
    } else if (c.id === 'partner_profile') {
      action = 'retain'; reason = f.kind === 'former_partner' ? 'former_partner_profile' : 'person_decides'; executable = false;
    } else if (c.id === 'applicant_records') {
      action = f.kind === 'partner' ? 'retain' : 'erase';
      reason = action === 'retain' ? 'contract_active' : 'none';
      executable = action === 'erase';
    }
    rows.push({ category: c.id, count, action, reason, until, executable });
  }
  return rows;
}
/** "Completed" only when nothing is held back; otherwise "partly done", never a quiet pass. */
export const outcomeOfPlan = (rows: PlanRow[]): 'completed' | 'partially_completed' => (rows.some((r) => r.action === 'retain') ? 'partially_completed' : 'completed');

export type PolicyProblem = 'summary_short' | 'body_short' | 'effective_invalid' | 'scheduled_pending';
export const policyEffectiveProblem = (effectiveFrom: string | null, now: number): PolicyProblem | null => {
  if (effectiveFrom === null) return null;
  const at = Date.parse(effectiveFrom);
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  return !Number.isFinite(at) || at < start.getTime() || at > now + POLICY_MAX_DAYS * 86_400_000 ? 'effective_invalid' : null;
};
export const last10 = (phone: string): string => phone.replace(/\D/g, '').slice(-10);
export const maskPhone = (phone10: string): string => (phone10.length >= 4 ? `••••••${phone10.slice(-4)}` : '••••');
export const lettersOf = (s: string): number => s.replace(/[^\p{L}]/gu, '').length;
