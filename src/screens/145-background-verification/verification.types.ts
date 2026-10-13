/** Screen 145 — Background & Document Verification. Types and translation keys only. */

import { CONDITIONAL_MAX_DAYS, FALLBACK_NOTE_MIN, HOWS, MAX_CONDITIONAL, NOTE_MIN, REASON_MIN } from '@/features/recruitment/verification';

export const POLL_MS = 30_000;
export const PAGE = 20;
export const STATUS_FILTERS = ['all', 'blocked', 'failed', 'conditional', 'clear'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];
export const ROLE_FILTERS = ['all', 'surveyor', 'technician', 'supplier'] as const;
export type RoleFilter = (typeof ROLE_FILTERS)[number];
export const boardPath = '/verification';
export const detailPath = (id: string) => `/verification/${id}`;
export { CONDITIONAL_MAX_DAYS, FALLBACK_NOTE_MIN, HOWS, MAX_CONDITIONAL, NOTE_MIN, REASON_MIN };

const rec = <T extends string | number>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const PROBLEMS = ['not_approved', 'not_open', 'service_unavailable', 'not_third_party', 'how_required', 'note_required', 'fallback_note_required', 'reference_not_verified', 'red_flag_failed_only', 'not_allowed', 'reason_required', 'deadline_invalid', 'too_many', 'already_resolved', 'not_found', 'not_admin', 'forbidden', 'offline', 'generic'] as const;

export const VERIFICATION_KEYS = {
  title: 'verification.title',
  subtitle: 'verification.subtitle',
  loading: 'verification.loading',
  error: { title: 'verification.error.title', body: 'verification.error.body' },
  notFound: { title: 'verification.notFound.title', body: 'verification.notFound.body' },
  filter: { search: 'verification.filter.search', role: 'verification.filter.role', status: 'verification.filter.status', ...rec('verification.filter', ['all', 'blocked', 'failed', 'conditional', 'clear'] as const) },
  list: {
    heading: 'verification.list.heading',
    hint: 'verification.list.hint',
    emptyTitle: 'verification.list.emptyTitle',
    emptyBody: 'verification.list.emptyBody',
    emptyFilteredTitle: 'verification.list.emptyFilteredTitle',
    emptyFilteredBody: 'verification.list.emptyFilteredBody',
    clear: 'verification.list.clear',
    more: 'verification.list.more',
  },
  row: { progress: 'verification.row.progress', failed: 'verification.row.failed', lapsed: 'verification.row.lapsed', due: 'verification.row.due', waiting: 'verification.row.waiting', today: 'verification.row.today' },
  gate: rec('verification.gate', ['clear', 'conditional', 'blocked'] as const),
  gateBody: rec('verification.gateBody', ['clear', 'conditional', 'blocked'] as const),
  service: {
    up: 'verification.service.up',
    down: 'verification.service.down',
    downBody: 'verification.service.downBody',
    demo: 'verification.service.demo',
    setDown: 'verification.service.setDown',
    setUp: 'verification.service.setUp',
    changed: 'verification.service.changed',
  },
  item: { identity: 'verification.item.identity', registration: 'verification.item.registration', skill: 'verification.item.skill', insurance: 'verification.item.insurance', licence: 'verification.item.licence', reference: 'verification.item.reference' },
  why: { identity: 'verification.why.identity', registration: 'verification.why.registration', skill: 'verification.why.skill', insurance: 'verification.why.insurance', licence: 'verification.why.licence', reference: 'verification.why.reference' },
  state: rec('verification.state', ['pending', 'passed', 'failed', 'conditional', 'lapsed'] as const),
  method: { third_party: 'verification.method.third_party', manual: 'verification.method.manual', fallback: 'verification.method.fallback' },
  how: rec('verification.how', HOWS),
  fact: {
    identity: 'verification.fact.identity',
    identityNone: 'verification.fact.identityNone',
    docYes: 'verification.fact.docYes',
    docNo: 'verification.fact.docNo',
    type: { pan: 'verification.fact.type.pan', aadhaar: 'verification.fact.type.aadhaar', gstin: 'verification.fact.type.gstin' },
    reference: 'verification.fact.reference',
    referenceNone: 'verification.fact.referenceNone',
    skill: 'verification.fact.skill',
  },
  serviceDetail: rec('verification.serviceDetail', ['verified', 'name_mismatch', 'no_document', 'bad_number', 'no_number'] as const),
  detail: {
    gateHeading: 'verification.detail.gateHeading',
    progress: 'verification.detail.progress',
    items: 'verification.detail.items',
    interview: 'verification.detail.interview',
    interviewOutcome: 'verification.detail.interviewOutcome',
    interviewNone: 'verification.detail.interviewNone',
    openInterview: 'verification.detail.openInterview',
    openApplication: 'verification.detail.openApplication',
    checkedBy: 'verification.detail.checkedBy',
    reference: 'verification.detail.reference',
    redFlag: 'verification.detail.redFlag',
    redFlagBody: 'verification.detail.redFlagBody',
    conditionalUntil: 'verification.detail.conditionalUntil',
    conditionalReason: 'verification.detail.conditionalReason',
    lapsedBody: 'verification.detail.lapsedBody',
    history: 'verification.detail.history',
    timeline: 'verification.detail.timeline',
    event: rec('verification.detail.event', ['service_check', 'manual', 'conditional', 'lapsed', 'service_down', 'cleared'] as const),
    fallbackNote: 'verification.detail.fallbackNote',
    none: 'verification.detail.none',
  },
  action: { check: 'verification.action.check', pass: 'verification.action.pass', fail: 'verification.action.fail', conditional: 'verification.action.conditional', back: 'verification.action.back', save: 'verification.action.save', grant: 'verification.action.grant', recheck: 'verification.action.recheck' },
  manual: {
    heading: 'verification.manual.heading',
    body: 'verification.manual.body',
    bodyFallback: 'verification.manual.bodyFallback',
    result: 'verification.manual.result',
    how: 'verification.manual.how',
    note: 'verification.manual.note',
    noteHint: 'verification.manual.noteHint',
    noteHintFallback: 'verification.manual.noteHintFallback',
    noteHintClearing: 'verification.manual.noteHintClearing',
    redFlag: 'verification.manual.redFlag',
    redFlagHint: 'verification.manual.redFlagHint',
    done: 'verification.manual.done',
  },
  conditional: {
    heading: 'verification.conditional.heading',
    body: 'verification.conditional.body',
    reason: 'verification.conditional.reason',
    reasonHint: 'verification.conditional.reasonHint',
    due: 'verification.conditional.due',
    dueHint: 'verification.conditional.dueHint',
    limit: 'verification.conditional.limit',
    never: 'verification.conditional.never',
    done: 'verification.conditional.done',
  },
  check: { done: 'verification.check.done', inconclusive: 'verification.check.inconclusive', passed: 'verification.check.passed', failed: 'verification.check.failed' },
  alert: { failed: 'verification.alert.failed', lapsed: 'verification.alert.lapsed' },
  problem: rec('verification.problem', PROBLEMS),
} as const;
