/** Screen 137 — Final Handover Checklist. Types and translation keys only. */

import { DOC_KINDS } from '@/features/qc/handover';

export type HandoverStatus = 'loading' | 'ready' | 'error' | 'not_found';
export const POLL_MS = 15_000;
export const DOCS = DOC_KINDS;
export const FINAL_ERRORS = ['issue_required', 'correction_required', 'review_reason_required', 'review_note_required', 'not_ready', 'invalid_state', 'blocked_doc', 'not_trivial', 'no_review', 'already_confirmed', 'not_found', 'forbidden'] as const;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
export const boardPath = '/qc-assignments';
export const assignmentPath = (id: string) => `/qc-assignments/${id}`;
export const snagsPath = (id: string) => `/snags/${id}`;
export const walkthroughPath = (id: string) => `/handover-walkthrough/${id}`;
export const compliancePath = (id: string) => `/compliance/${id}`;
export const mechanicalPath = (id: string) => `/qc-mechanical/${id}`;
export const electricalPath = (id: string) => `/qc-electrical/${id}`;

export const HANDOVER_KEYS = {
  title: 'handover.title',
  loading: 'handover.loading',
  back: 'handover.back',
  more: 'handover.more',
  error: { title: 'handover.error.title', body: 'handover.error.body' },
  noJob: { title: 'handover.noJob.title', body: 'handover.noJob.body', action: 'handover.noJob.action' },
  notFound: { title: 'handover.notFound.title', body: 'handover.notFound.body', action: 'handover.notFound.action' },
  problem: rec('handover.problem', [...FINAL_ERRORS, 'offline', 'generic'] as const),
  hero: { heading: 'handover.hero.heading', intro: 'handover.hero.intro', remaining: 'handover.hero.remaining', allDone: 'handover.hero.allDone' },
  status: rec('handover.status', ['blocked', 'ready', 'confirmed', 'reopened'] as const),
  mandatory: 'handover.mandatory',
  optional: 'handover.optional',
  done: 'handover.done',
  open: 'handover.open',
  step: {
    qc: { title: 'handover.step.qc.title', body: 'handover.step.qc.body', mech: 'handover.step.qc.mech', elec: 'handover.step.qc.elec', open: 'handover.step.qc.open', signed: 'handover.step.qc.signed' },
    snags: { title: 'handover.step.snags.title', body: 'handover.step.snags.body', clear: 'handover.step.snags.clear', open: 'handover.step.snags.open', safety: 'handover.step.snags.safety', functional: 'handover.step.snags.functional', cosmetic: 'handover.step.snags.cosmetic', pending: 'handover.step.snags.pending', disputed: 'handover.step.snags.disputed', link: 'handover.step.snags.link' },
    certificate: { title: 'handover.step.certificate.title', body: 'handover.step.certificate.body', issued: 'handover.step.certificate.issued', missing: 'handover.step.certificate.missing', historic: 'handover.step.certificate.historic', link: 'handover.step.certificate.link' },
    review: { title: 'handover.step.review.title', body: 'handover.step.review.body', reason: 'handover.step.review.reason', done: 'handover.step.review.done', complete: 'handover.step.review.complete', note: 'handover.step.review.note', noteHint: 'handover.step.review.noteHint', go: 'handover.step.review.go', toast: 'handover.step.review.toast' },
  },
  docs: {
    heading: 'handover.docs.heading',
    intro: 'handover.docs.intro',
    name: rec('handover.docs.name', DOCS),
    about: rec('handover.docs.about', DOCS),
    state: rec('handover.docs.state', ['blocked', 'pending', 'issue', 'outdated', 'ready'] as const),
    block: rec('handover.docs.block', ['no_spec', 'materials_unconfirmed', 'no_amc_tiers'] as const),
    basis: 'handover.docs.basis',
    checkedBy: 'handover.docs.checkedBy',
    outdated: 'handover.docs.outdated',
    confirm: 'handover.docs.confirm',
    confirmToast: 'handover.docs.confirmToast',
    report: 'handover.docs.report',
    reportTitle: 'handover.docs.reportTitle',
    reportBody: 'handover.docs.reportBody',
    reportLabel: 'handover.docs.reportLabel',
    reportHint: 'handover.docs.reportHint',
    reportGo: 'handover.docs.reportGo',
    reportToast: 'handover.docs.reportToast',
    issue: 'handover.docs.issue',
    resolve: 'handover.docs.resolve',
    resolveTitle: 'handover.docs.resolveTitle',
    resolveBody: 'handover.docs.resolveBody',
    resolveLabel: 'handover.docs.resolveLabel',
    resolveGo: 'handover.docs.resolveGo',
    resolveToast: 'handover.docs.resolveToast',
    resolved: 'handover.docs.resolved',
    typo: 'handover.docs.typo',
    typoTitle: 'handover.docs.typoTitle',
    typoBody: 'handover.docs.typoBody',
    typoLabel: 'handover.docs.typoLabel',
    typoGo: 'handover.docs.typoGo',
    typoToast: 'handover.docs.typoToast',
    corrections: 'handover.docs.corrections',
  },
  review: { add: 'handover.review.add', title: 'handover.review.title', body: 'handover.review.body', reason: 'handover.review.reason', hint: 'handover.review.hint', go: 'handover.review.go', toast: 'handover.review.toast' },
  confirm: { button: 'handover.confirm.button', waiting: 'handover.confirm.waiting', title: 'handover.confirm.title', body: 'handover.confirm.body', go: 'handover.confirm.go', back: 'handover.confirm.back', toast: 'handover.confirm.toast', done: 'handover.confirm.done', unlocked: 'handover.confirm.unlocked', openWalkthrough: 'handover.confirm.openWalkthrough', reopened: 'handover.confirm.reopened', reconfirm: 'handover.confirm.reconfirm', readonly: 'handover.confirm.readonly', legacy: 'handover.confirm.legacy' },
  cancel: 'handover.cancel',
} as const;
