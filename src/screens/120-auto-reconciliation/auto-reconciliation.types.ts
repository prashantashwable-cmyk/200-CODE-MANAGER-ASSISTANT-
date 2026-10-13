/** Screen 120 — Auto-Reconciliation. Types and translation keys only. */

import type { ReconExceptionKind, ReconReason, ReconRunStatus } from '@/data/types';
import type { ReconSeverityView } from '@/data/repository';

export type ReconStatus = 'loading' | 'ready' | 'error';

/** How often the board re-reads while open. */
export const POLL_MS = 30_000;

export type ReconTab = 'open' | 'runs' | 'explained';
export const TABS: ReconTab[] = ['open', 'runs', 'explained'];

export const KINDS: ReconExceptionKind[] = ['duplicate_debit', 'duplicate_credit', 'recorded_twice', 'unrecorded_credit', 'unrecorded_debit', 'missing_in_bank', 'amount_differs', 'bank_charge'];
export const REASONS: ReconReason[] = ['bank_fee', 'rounding', 'verified'];
export const RUN_STATUSES: ReconRunStatus[] = ['passed', 'review', 'failed', 'could_not_run'];
export const SEVERITIES: ReconSeverityView[] = ['critical', 'high', 'low'];
export const LEDGER_KINDS = ['supplier_payment', 'customer_receipt', 'customer_refund', 'worker_payout'] as const;

export const NOTE_MIN = 8;
export const SERIOUS_NOTE_MIN = 20;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const RECON_KEYS = {
  title: 'reconciliation.title',
  subtitle: 'reconciliation.subtitle',
  loading: 'reconciliation.loading',
  runNow: 'reconciliation.runNow',
  running: 'reconciliation.running',
  error: { title: 'reconciliation.error.title', body: 'reconciliation.error.body' },
  alert: { ...rec('reconciliation.alert', KINDS), noBank: 'reconciliation.alert.noBank' },
  status: rec('reconciliation.status', RUN_STATUSES),
  severity: rec('reconciliation.severity', SEVERITIES),
  hero: {
    latest: 'reconciliation.hero.latest',
    counts: 'reconciliation.hero.counts',
    window: 'reconciliation.hero.window',
    next: 'reconciliation.hero.next',
    noRunTitle: 'reconciliation.hero.noRunTitle',
    noRunBody: 'reconciliation.hero.noRunBody',
    couldNotTitle: 'reconciliation.hero.couldNotTitle',
    couldNotBody: 'reconciliation.hero.couldNotBody',
    passedBody: 'reconciliation.hero.passedBody',
    reviewBody: 'reconciliation.hero.reviewBody',
    failedBody: 'reconciliation.hero.failedBody',
  },
  feed: {
    heading: 'reconciliation.feed.heading',
    connected: 'reconciliation.feed.connected',
    unavailable: 'reconciliation.feed.unavailable',
    since: 'reconciliation.feed.since',
    lastStatement: 'reconciliation.feed.lastStatement',
    reason: { outage: 'reconciliation.feed.reason.outage', consent_expired: 'reconciliation.feed.reason.consent_expired' },
    simulateDown: 'reconciliation.feed.simulateDown',
    simulateUp: 'reconciliation.feed.simulateUp',
    demoNote: 'reconciliation.feed.demoNote',
    downToast: 'reconciliation.feed.downToast',
    upToast: 'reconciliation.feed.upToast',
  },
  totals: {
    matched: 'reconciliation.totals.matched',
    open: 'reconciliation.totals.open',
    serious: 'reconciliation.totals.serious',
    explained: 'reconciliation.totals.explained',
    pending: 'reconciliation.totals.pending',
  },
  tabs: { label: 'reconciliation.tabs.label', ...rec('reconciliation.tabs', TABS) },
  open: {
    intro: 'reconciliation.open.intro',
    seriousHeading: 'reconciliation.open.seriousHeading',
    otherHeading: 'reconciliation.open.otherHeading',
    emptyTitle: 'reconciliation.open.emptyTitle',
    emptyBody: 'reconciliation.open.emptyBody',
    blindTitle: 'reconciliation.open.blindTitle',
    blindBody: 'reconciliation.open.blindBody',
    pendingHeading: 'reconciliation.open.pendingHeading',
    pendingBody: 'reconciliation.open.pendingBody',
    age: 'reconciliation.open.age',
    firstSeen: 'reconciliation.open.firstSeen',
  },
  runs: {
    intro: 'reconciliation.runs.intro',
    scheduled: 'reconciliation.runs.scheduled',
    manual: 'reconciliation.runs.manual',
    counts: 'reconciliation.runs.counts',
    countsNone: 'reconciliation.runs.countsNone',
    emptyTitle: 'reconciliation.runs.emptyTitle',
    emptyBody: 'reconciliation.runs.emptyBody',
  },
  explained: {
    intro: 'reconciliation.explained.intro',
    by: 'reconciliation.explained.by',
    cleared: 'reconciliation.explained.cleared',
    emptyTitle: 'reconciliation.explained.emptyTitle',
    emptyBody: 'reconciliation.explained.emptyBody',
  },
  kind: Object.fromEntries(KINDS.map((k) => [k, { title: `reconciliation.kind.${k}.title`, why: `reconciliation.kind.${k}.why` }])) as Record<ReconExceptionKind, { title: string; why: string }>,
  direction: { in: 'reconciliation.direction.in', out: 'reconciliation.direction.out' },
  ledgerKind: rec('reconciliation.ledgerKind', LEDGER_KINDS),
  detail: {
    bankHeading: 'reconciliation.detail.bankHeading',
    appHeading: 'reconciliation.detail.appHeading',
    nothingBank: 'reconciliation.detail.nothingBank',
    nothingApp: 'reconciliation.detail.nothingApp',
    difference: 'reconciliation.detail.difference',
    reference: 'reconciliation.detail.reference',
    noReference: 'reconciliation.detail.noReference',
    whyHeading: 'reconciliation.detail.whyHeading',
    openRecord: 'reconciliation.detail.openRecord',
    firstRun: 'reconciliation.detail.firstRun',
    seriousWarning: 'reconciliation.detail.seriousWarning',
    posted: 'reconciliation.detail.posted',
    recorded: 'reconciliation.detail.recorded',
  },
  reconcile: {
    heading: 'reconciliation.reconcile.heading',
    intro: 'reconciliation.reconcile.intro',
    category: 'reconciliation.reconcile.category',
    note: 'reconciliation.reconcile.note',
    noteHint: 'reconciliation.reconcile.noteHint',
    noteHintSerious: 'reconciliation.reconcile.noteHintSerious',
    confirm: 'reconciliation.reconcile.confirm',
    submit: 'reconciliation.reconcile.submit',
    done: 'reconciliation.reconcile.done',
    already: 'reconciliation.reconcile.already',
    reason: rec('reconciliation.reconcile.reason', REASONS),
    reasonHint: rec('reconciliation.reconcile.reasonHint', REASONS),
  },
  run: {
    heading: 'reconciliation.run.heading',
    window: 'reconciliation.run.window',
    matchedHeading: 'reconciliation.run.matchedHeading',
    matchedNone: 'reconciliation.run.matchedNone',
    unmatchedHeading: 'reconciliation.run.unmatchedHeading',
    unmatchedNone: 'reconciliation.run.unmatchedNone',
    couldNot: 'reconciliation.run.couldNot',
    ranBy: 'reconciliation.run.ranBy',
    ran: 'reconciliation.run.ran',
  },
  runToast: { done: 'reconciliation.runToast.done', couldNot: 'reconciliation.runToast.couldNot' },
  problem: rec('reconciliation.problem', ['generic', 'forbidden', 'not_found', 'invalid_state', 'note_required', 'category_not_for_kind', 'too_large_for_category', 'serious_needs_confirmation'] as const),
} as const;
