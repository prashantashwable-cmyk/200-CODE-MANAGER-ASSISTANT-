/**
 * Custom rules (182): the plain-language "if this, then that" an Admin can add without code. Pure: the builder screen and the repository read the same definitions, so what the
 * screen says a rule means and what the repository does with it cannot differ. A rule watches one kind of record, has up to a few simple conditions and one action; anything
 * bigger is meant to be several clearly named rules.
 */

export const SUBJECT_IDS = ['lead', 'payment', 'job', 'ticket'] as const;
export type SubjectId = (typeof SUBJECT_IDS)[number];
export type FieldKind = 'number' | 'money' | 'choice' | 'bool' | 'text';
export interface FieldDef { id: string; kind: FieldKind; unit?: 'days' | 'hours' | 'points'; choices?: string[] }

export const FIELDS: Record<SubjectId, FieldDef[]> = {
  lead: [
    { id: 'daysUntouched', kind: 'number', unit: 'days' },
    { id: 'daysInStage', kind: 'number', unit: 'days' },
    { id: 'stage', kind: 'choice', choices: ['captured', 'contacted', 'site_visit', 'quoted', 'negotiation'] },
    { id: 'value', kind: 'money' },
    { id: 'city', kind: 'text' },
    { id: 'source', kind: 'choice', choices: ['field_survey', 'referral_repeat', 'inbound_website', 'inbound_whatsapp', 'bulk_import'] },
    { id: 'score', kind: 'number', unit: 'points' },
    { id: 'unassigned', kind: 'bool' },
  ],
  payment: [
    { id: 'daysOverdue', kind: 'number', unit: 'days' },
    { id: 'remaining', kind: 'money' },
    { id: 'status', kind: 'choice', choices: ['due', 'pending', 'overdue', 'failed'] },
    { id: 'stage', kind: 'choice', choices: ['advance', 'material', 'installation', 'handover', 'retention'] },
  ],
  job: [
    { id: 'status', kind: 'choice', choices: ['scheduled', 'materials_pending', 'in_progress', 'qc_pending', 'handover_pending', 'on_hold'] },
    { id: 'daysSinceStart', kind: 'number', unit: 'days' },
    { id: 'daysSinceBooked', kind: 'number', unit: 'days' },
  ],
  ticket: [
    { id: 'ageHours', kind: 'number', unit: 'hours' },
    { id: 'urgency', kind: 'choice', choices: ['emergency', 'high', 'normal', 'low'] },
    { id: 'status', kind: 'choice', choices: ['submitted', 'assigned', 'in_progress'] },
    { id: 'category', kind: 'choice', choices: ['emergency', 'safety', 'fault', 'billing', 'general', 'maintenance'] },
  ],
};

export type Op = 'gte' | 'lte' | 'eq' | 'is' | 'isNot' | 'contains';
export const OPS: Record<FieldKind, Op[]> = { number: ['gte', 'lte', 'eq'], money: ['gte', 'lte'], choice: ['is', 'isNot'], bool: ['is'], text: ['is', 'contains'] };

export interface Condition { field: string; op: Op; value: string }
export type ActionKind = 'alert' | 'task' | 'message';
export interface RuleAction { kind: ActionKind; severity?: 'low' | 'medium' | 'high'; note?: string; dueInDays?: number; templateGroupId?: string }
export interface RuleDraft { name: string; subject: SubjectId; logic: 'all' | 'any'; conditions: Condition[]; action: RuleAction }
export type RecordValues = Record<string, string | number>;

export const MAX_CONDITIONS = 4;
/** Three or more conditions, or "any" joined to several, starts to be hard to reason about: the builder nudges toward two named rules. */
export const BUSY_AT = 3;
export const NAME_MIN = 3;
export const NOTE_MAX = 200;
export const TASK_DAYS_MAX = 30;
/** A rule that would act on this many records the moment it goes live has to be confirmed, or started "from now on". */
export const MANY_AT = 25;
/** The most one rule acts on in one run: the rest wait for the next, so a mistake cannot flood people. */
export const MAX_PER_RUN = 20;

export const fieldDef = (subject: SubjectId, id: string): FieldDef | undefined => FIELDS[subject].find((f) => f.id === id);
export const defaultCondition = (subject: SubjectId): Condition => { const f = FIELDS[subject][0]; return { field: f.id, op: OPS[f.kind][0], value: '' }; };
export const emptyDraft = (subject: SubjectId = 'lead'): RuleDraft => ({ name: '', subject, logic: 'all', conditions: [defaultCondition(subject)], action: { kind: 'alert', severity: 'medium' } });

const num = (v: string): number | null => { const n = Number(v.replace(/[,\s₹]/g, '')); return v.trim() !== '' && Number.isFinite(n) ? n : null; };
export const parseNumber = num;

/** Whether one condition holds for the values of a record. A missing value never matches. */
export function holds(c: Condition, values: RecordValues, subject: SubjectId): boolean {
  const def = fieldDef(subject, c.field);
  const got = values[c.field];
  if (!def || got === undefined) return false;
  if (def.kind === 'number' || def.kind === 'money') {
    const want = num(c.value);
    if (want === null) return false;
    const g = Number(got);
    return c.op === 'gte' ? g >= want : c.op === 'lte' ? g <= want : g === want;
  }
  const g = String(got).toLowerCase();
  const w = c.value.trim().toLowerCase();
  if (def.kind === 'text') return c.op === 'contains' ? g.includes(w) : g === w;
  return c.op === 'isNot' ? g !== w : g === w;
}
export function matches(d: RuleDraft, values: RecordValues): boolean {
  const results = d.conditions.map((c) => holds(c, values, d.subject));
  return d.logic === 'all' ? results.length > 0 && results.every(Boolean) : results.some(Boolean);
}
/** Which conditions failed for a record, in order (for the "why not" of a sample test). */
export const failedConditions = (d: RuleDraft, values: RecordValues): number[] => d.conditions.flatMap((c, i) => (holds(c, values, d.subject) ? [] : [i]));

export type Problem = 'name_required' | 'conditions_required' | 'too_many_conditions' | 'condition_incomplete' | 'value_invalid' | 'duplicate_condition' | 'never_matches' | 'task_days_invalid' | 'template_required' | 'note_long' | 'severity_required';
/** Everything wrong with a draft, so the builder can say it as the person types and the repository can refuse the same things. */
export function draftProblems(d: RuleDraft): Problem[] {
  const out: Problem[] = [];
  if (d.name.replace(/[^\p{L}\p{N}]/gu, '').length < NAME_MIN) out.push('name_required');
  if (d.conditions.length === 0) out.push('conditions_required');
  if (d.conditions.length > MAX_CONDITIONS) out.push('too_many_conditions');
  const seen = new Set<string>();
  for (const c of d.conditions) {
    const def = fieldDef(d.subject, c.field);
    if (!def || !OPS[def.kind].includes(c.op) || (c.value.trim() === '' && def.kind !== 'bool')) { if (!out.includes('condition_incomplete')) out.push('condition_incomplete'); continue; }
    if ((def.kind === 'number' || def.kind === 'money') && num(c.value) === null) { if (!out.includes('value_invalid')) out.push('value_invalid'); }
    if (def.kind === 'choice' && !(def.choices ?? []).includes(c.value)) { if (!out.includes('value_invalid')) out.push('value_invalid'); }
    if (def.kind === 'bool' && c.value !== 'yes' && c.value !== 'no') { if (!out.includes('value_invalid')) out.push('value_invalid'); }
    const key = `${c.field}|${c.op}`;
    if (seen.has(key) && !out.includes('duplicate_condition')) out.push('duplicate_condition');
    seen.add(key);
  }
  // "all" of a floor above a ceiling can never be true.
  if (d.logic === 'all') {
    for (const f of new Set(d.conditions.map((c) => c.field))) {
      const lo = d.conditions.filter((c) => c.field === f && c.op === 'gte').map((c) => num(c.value)).filter((n): n is number => n !== null);
      const hi = d.conditions.filter((c) => c.field === f && c.op === 'lte').map((c) => num(c.value)).filter((n): n is number => n !== null);
      if (lo.length && hi.length && Math.max(...lo) > Math.min(...hi) && !out.includes('never_matches')) out.push('never_matches');
    }
  }
  if (d.action.kind === 'task' && !(Number.isInteger(d.action.dueInDays) && (d.action.dueInDays as number) >= 1 && (d.action.dueInDays as number) <= TASK_DAYS_MAX)) out.push('task_days_invalid');
  if (d.action.kind === 'message' && !d.action.templateGroupId) out.push('template_required');
  if (d.action.kind === 'alert' && !d.action.severity) out.push('severity_required');
  if ((d.action.note ?? '').length > NOTE_MAX) out.push('note_long');
  return out;
}

export type Complexity = 'simple' | 'busy' | 'complex';
export const complexityOf = (d: RuleDraft): Complexity => {
  const weight = d.conditions.length + (d.logic === 'any' && d.conditions.length > 1 ? 1 : 0);
  return weight >= MAX_CONDITIONS ? 'complex' : weight >= BUSY_AT ? 'busy' : 'simple';
};

export type ConflictKind = 'specialised' | 'duplicate';
export interface Conflict { kind: ConflictKind; target: string; route: string | null; ruleId?: string }
/** Specialised screens already own these combinations; a custom rule that acts the same way would act at cross purposes with them. */
const SPECIALISED: { when: (d: RuleDraft) => boolean; target: string; route: string }[] = [
  { when: (d) => d.subject === 'payment' && (d.action.kind === 'message' || d.action.kind === 'task'), target: 'paymentReminders', route: '/admin/analytics/collections/reminders' },
  { when: (d) => d.subject === 'lead' && d.action.kind === 'message', target: 'sequences', route: '/admin/comm/sequences' },
  { when: (d) => d.subject === 'lead' && d.action.kind === 'task', target: 'followUps', route: '/admin/leads/follow-ups' },
  { when: (d) => d.subject === 'ticket' && d.action.kind === 'message', target: 'ticketNotices', route: '/service-requests' },
];
const keyset = (d: RuleDraft): Set<string> => new Set(d.conditions.map((c) => `${c.field}|${c.op}`));
/** Overlap with a dedicated screen, or with another custom rule that does nearly the same on the same records. `others` are the rules that are still in play (not retired). */
export function conflictsOf(d: RuleDraft, others: { id: string; draft: RuleDraft }[]): Conflict[] {
  const out: Conflict[] = SPECIALISED.filter((s) => s.when(d)).map((s) => ({ kind: 'specialised', target: s.target, route: s.route }));
  const mine = keyset(d);
  for (const o of others) {
    if (o.draft.subject !== d.subject || o.draft.action.kind !== d.action.kind) continue;
    const theirs = keyset(o.draft);
    const both = [...mine].filter((k) => theirs.has(k)).length;
    const either = new Set([...mine, ...theirs]).size;
    if (either > 0 && both / either >= 0.75) out.push({ kind: 'duplicate', target: o.id, route: null, ruleId: o.id });
  }
  return out;
}

/** A short stable fingerprint of what a rule means, so activation can insist the test was of exactly this rule. */
export function draftHash(d: RuleDraft): string {
  const s = JSON.stringify({ s: d.subject, l: d.logic, c: d.conditions.map((c) => [c.field, c.op, c.value.trim().toLowerCase()]), a: [d.action.kind, d.action.severity ?? '', d.action.dueInDays ?? '', d.action.templateGroupId ?? '', d.action.note ?? ''] });
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** Starting points a person can adapt (the library's built-in examples). The names and hints are translation keys under `workflowRules.starter.<id>`. */
export const STARTERS: { id: string; draft: Omit<RuleDraft, 'name'> }[] = [
  { id: 'untouchedHighValue', draft: { subject: 'lead', logic: 'all', conditions: [{ field: 'daysUntouched', op: 'gte', value: '10' }, { field: 'value', op: 'gte', value: '1000000' }], action: { kind: 'alert', severity: 'medium' } } },
  { id: 'unassignedLead', draft: { subject: 'lead', logic: 'all', conditions: [{ field: 'unassigned', op: 'is', value: 'yes' }, { field: 'daysInStage', op: 'gte', value: '2' }], action: { kind: 'alert', severity: 'low' } } },
  { id: 'bigOverdue', draft: { subject: 'payment', logic: 'all', conditions: [{ field: 'daysOverdue', op: 'gte', value: '14' }, { field: 'remaining', op: 'gte', value: '200000' }], action: { kind: 'alert', severity: 'high' } } },
  { id: 'ticketWaiting', draft: { subject: 'ticket', logic: 'all', conditions: [{ field: 'ageHours', op: 'gte', value: '20' }, { field: 'status', op: 'is', value: 'submitted' }], action: { kind: 'alert', severity: 'medium' } } },
  { id: 'jobStuck', draft: { subject: 'job', logic: 'all', conditions: [{ field: 'status', op: 'is', value: 'materials_pending' }, { field: 'daysSinceBooked', op: 'gte', value: '7' }], action: { kind: 'task', dueInDays: 2 } } },
];
