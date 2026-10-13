/**
 * The automation sandbox (190): standard scenarios, how a simulated outcome is compared with an expected one (or with the last accepted baseline), and when a rule counts as tested. Pure: the
 * screen and the repository read the same rules. A test only ever reads a rule and a scenario; nothing it does can reach a real customer, partner or amount. Every number is a placeholder.
 */
import { FIELDS } from '@/features/automation/customRules';
import type { SubjectId } from '@/features/automation/customRules';

export const ENGINES = ['custom_rule', 'escalation', 'commission'] as const;
export type Engine = (typeof ENGINES)[number];
export type FactValue = string | number | boolean;
export type Facts = Record<string, FactValue>;
export type Outcome = Record<string, FactValue>;

/** A library that has not been looked at for this long is flagged: typical deals and delays drift. */
export const REVIEW_EVERY_DAYS = 180;
/** A rule that passed its tests and is still not live after this long is surfaced as a good change going nowhere. */
export const PROMOTE_NUDGE_DAYS = 7;
export const MONEY_TOLERANCE = 0.005;
export const PCT_TOLERANCE = 0.05;
export const NAME_MIN = 3;
export const NOTE_MIN = 10;
export const MAX_SCENARIOS = 60;

export interface FieldSchema { id: string; kind: 'number' | 'money' | 'choice' | 'bool'; options?: string[] }

/** The facts a scenario carries, per engine. For a custom rule the record's own fields depend on what kind of record the rule watches. */
export const SOURCES = ['field', 'referral'] as const;
export const FACT_SCHEMA: Record<Exclude<Engine, 'custom_rule'>, FieldSchema[]> = {
  escalation: [
    { id: 'kind', kind: 'choice', options: ['sos', 'safety', 'payout_failure', 'critical_exception', 'high_exception'] },
    { id: 'ageMinutes', kind: 'number' },
  ],
  commission: [
    { id: 'dealValue', kind: 'money' },
    { id: 'source', kind: 'choice', options: [...SOURCES] },
    { id: 'surveyorTier', kind: 'choice', options: ['new', 'established', 'senior'] },
    { id: 'closer', kind: 'bool' },
    { id: 'leadMinutes', kind: 'number' },
    { id: 'assistantMinutes', kind: 'number' },
    { id: 'inspectors', kind: 'number' },
  ],
};
export const customFieldsOf = (subject: SubjectId): FieldSchema[] => FIELDS[subject].map((f) => ({ id: f.id, kind: f.kind === 'text' ? 'choice' : f.kind === 'bool' ? 'bool' : f.kind === 'choice' ? 'choice' : f.kind === 'money' ? 'money' : 'number', options: f.choices }));

/** What an Admin can say they expect, per engine: only the fields that matter, never the whole outcome. */
export const EXPECT_SCHEMA: Record<Engine, FieldSchema[]> = {
  custom_rule: [{ id: 'fires', kind: 'bool' }, { id: 'action', kind: 'choice', options: ['none', 'alert', 'task', 'message'] }],
  escalation: [{ id: 'tiersFired', kind: 'number' }, { id: 'reachesBackup', kind: 'bool' }, { id: 'exhausted', kind: 'bool' }],
  commission: [{ id: 'total', kind: 'money' }, { id: 'surveyor', kind: 'money' }],
};

export interface BuiltInScenario { id: string; engine: Engine; facts: Facts }
/** Standard scenarios (placeholders for the owner to keep representative): a typical lead, a typical overdue payment, a typical delivery delay and the like. */
export const BUILT_IN: BuiltInScenario[] = [
  { id: 'lead_typical', engine: 'custom_rule', facts: { subject: 'lead', daysUntouched: 2, daysInStage: 3, stage: 'contacted', value: 1_800_000, city: 'Pune', source: 'field_survey', score: 55, unassigned: false } },
  { id: 'lead_stuck', engine: 'custom_rule', facts: { subject: 'lead', daysUntouched: 12, daysInStage: 20, stage: 'quoted', value: 2_500_000, city: 'Pune', source: 'inbound_website', score: 60, unassigned: false } },
  { id: 'lead_unassigned', engine: 'custom_rule', facts: { subject: 'lead', daysUntouched: 1, daysInStage: 1, stage: 'captured', value: 1_200_000, city: 'Nashik', source: 'inbound_whatsapp', score: 40, unassigned: true } },
  { id: 'payment_overdue', engine: 'custom_rule', facts: { subject: 'payment', daysOverdue: 12, remaining: 188_000, status: 'overdue', stage: 'material' } },
  { id: 'payment_overdue_large', engine: 'custom_rule', facts: { subject: 'payment', daysOverdue: 45, remaining: 800_000, status: 'overdue', stage: 'installation' } },
  { id: 'delivery_delay', engine: 'custom_rule', facts: { subject: 'job', status: 'materials_pending', daysSinceBooked: 9, daysSinceStart: 0 } },
  { id: 'ticket_waiting', engine: 'custom_rule', facts: { subject: 'ticket', ageHours: 30, urgency: 'normal', status: 'submitted', category: 'fault' } },
  { id: 'esc_sos', engine: 'escalation', facts: { kind: 'sos', ageMinutes: 12 } },
  { id: 'esc_critical', engine: 'escalation', facts: { kind: 'critical_exception', ageMinutes: 45 } },
  { id: 'esc_payout', engine: 'escalation', facts: { kind: 'payout_failure', ageMinutes: 300 } },
  { id: 'esc_high', engine: 'escalation', facts: { kind: 'high_exception', ageMinutes: 90 } },
  { id: 'com_residential', engine: 'commission', facts: { dealValue: 1_800_000, source: 'field', surveyorTier: 'established', closer: false, leadMinutes: 480, assistantMinutes: 360, inspectors: 1 } },
  { id: 'com_commercial', engine: 'commission', facts: { dealValue: 6_000_000, source: 'field', surveyorTier: 'senior', closer: true, leadMinutes: 900, assistantMinutes: 700, inspectors: 2 } },
  { id: 'com_referral', engine: 'commission', facts: { dealValue: 2_400_000, source: 'referral', surveyorTier: 'new', closer: false, leadMinutes: 520, assistantMinutes: 300, inspectors: 1 } },
];

export interface Comparison { field: string; expected: FactValue | null; actual: FactValue; match: boolean }
const moneyField = (f: string): boolean => f === 'total' || f === 'surveyor' || f === 'technicians';
export function matchesValue(field: string, expected: FactValue, actual: FactValue): boolean {
  if (typeof expected === 'number' && typeof actual === 'number') {
    if (field === 'burdenPct') return Math.abs(expected - actual) <= PCT_TOLERANCE;
    return moneyField(field) ? Math.abs(expected - actual) <= Math.max(1, Math.abs(expected) * MONEY_TOLERANCE) : expected === actual;
  }
  return expected === actual;
}
/** Expected against actual, field by field. Only what was declared is compared (a baseline declares everything). */
export function compareOutcome(expected: Outcome, actual: Outcome): Comparison[] {
  return Object.keys(expected).map((field) => ({ field, expected: expected[field], actual: actual[field] ?? '', match: field in actual && matchesValue(field, expected[field], actual[field]) }));
}
export type RunStatus = 'matched' | 'differs' | 'new';
export const statusOfComparisons = (c: Comparison[] | null): RunStatus => (c === null ? 'new' : c.every((x) => x.match) ? 'matched' : 'differs');

export type ScenarioProblem = 'name_short' | 'facts_missing' | 'too_many' | 'engine_unknown';
export function scenarioProblem(input: { engine: string; name: string; facts: Facts }, count: number): ScenarioProblem | null {
  if (!(ENGINES as readonly string[]).includes(input.engine)) return 'engine_unknown';
  if (input.name.replace(/[^\p{L}\p{N}]/gu, '').length < NAME_MIN) return 'name_short';
  if (count >= MAX_SCENARIOS) return 'too_many';
  const schema = input.engine === 'custom_rule' ? customFieldsOf((input.facts.subject as SubjectId) ?? 'lead') : FACT_SCHEMA[input.engine as Exclude<Engine, 'custom_rule'>];
  return schema.every((f) => f.id in input.facts) ? null : 'facts_missing';
}

export type PromotionStatus = 'untested' | 'tested_passed' | 'tested_failed' | 'stale' | 'promoted';
/** Where a rule stands on its way live: tested at exactly its current definition and passing, tested and failing, tested before it last changed, or already running. */
export function promotionStatus(input: { ruleStatus: string; testedHash: string | null; currentHash: string; passed: boolean | null }): PromotionStatus {
  if (input.ruleStatus === 'active') return 'promoted';
  if (input.testedHash === null) return 'untested';
  if (input.testedHash !== input.currentHash) return 'stale';
  return input.passed ? 'tested_passed' : 'tested_failed';
}

export const hashText = (s: string): string => { let h = 5381; for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(16).padStart(8, '0'); };
export const reviewDue = (reviewedAt: string, now: number): boolean => now - Date.parse(reviewedAt) >= REVIEW_EVERY_DAYS * 86_400_000;
export const reviewDueAt = (reviewedAt: string): string => new Date(Date.parse(reviewedAt) + REVIEW_EVERY_DAYS * 86_400_000).toISOString();
