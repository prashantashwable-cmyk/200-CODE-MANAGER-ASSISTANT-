/** Screen 127 — Issue/Blocker Reporting. Types and translation keys only. */

import type { IssueCategory, IssueResolutionKind, IssueSeverity } from '@/data/types';

export type IssuesStatus = 'loading' | 'ready' | 'error' | 'not_found';

export const POLL_MS = 20_000;
export const queueKey = (userId: string) => `aiec.issueQueue.${userId}`;
export const viewKey = (userId: string, jobId: string) => `aiec.issueView.${userId}.${jobId}`;
export const draftKey = (userId: string, jobId: string) => `aiec.issueDraft.${userId}.${jobId}`;

export const CATEGORY_IDS: IssueCategory[] = ['parts', 'site_condition', 'customer_readiness', 'safety_concern', 'other'];
export const SEVERITY_IDS: IssueSeverity[] = ['minor', 'blocking', 'safety'];
export const RESOLUTION_IDS: IssueResolutionKind[] = ['self_resolved', 'fixed_on_site', 'admin_resolved', 'no_longer_relevant'];
export const OUTCOMES = ['sop_updated', 'no_change', 'training_planned'] as const;

export const FINAL_ERRORS = [
  'description_required', 'severity_too_low', 'unknown_step', 'too_many_attachments', 'job_finished', 'forbidden', 'not_found', 'invalid_state', 'note_required', 'safety_admin_only',
  'captured_in_future', 'captured_invalid', 'video_too_large', 'video_too_long', 'wrong_kind', 'not_a_video', 'not_a_photo',
] as const;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const jobPath = (id: string) => `/technician/jobs/${id}`;
export const boardPath = '/job-issues';
export const issuesPath = (jobId: string, issueId?: string) => `/job-issues/${jobId}${issueId ? `?issue=${issueId}` : ''}`;
export const homePath = '/technician';

export const ISSUE_KEYS = {
  title: 'issueReport.title',
  boardTitle: 'issueReport.boardTitle',
  loading: 'issueReport.loading',
  back: 'issueReport.back',
  error: { title: 'issueReport.error.title', body: 'issueReport.error.body' },
  notFound: { title: 'issueReport.notFound.title', body: 'issueReport.notFound.body' },
  pick: { title: 'issueReport.pick.title', body: 'issueReport.pick.body', action: 'issueReport.pick.action' },
  sync: { offline: 'issueReport.sync.offline', queued: 'issueReport.sync.queued', syncing: 'issueReport.sync.syncing', notSent: 'issueReport.sync.notSent', videoRisk: 'issueReport.sync.videoRisk', callNow: 'issueReport.sync.callNow' },
  failed: { title: 'issueReport.failed.title', item: 'issueReport.failed.item', dismiss: 'issueReport.failed.dismiss' },
  problem: rec('issueReport.problem', [...FINAL_ERRORS, 'generic'] as const),
  category: rec('issueReport.category', CATEGORY_IDS),
  categoryHint: rec('issueReport.categoryHint', CATEGORY_IDS),
  severity: rec('issueReport.severity', SEVERITY_IDS),
  severityHint: rec('issueReport.severityHint', SEVERITY_IDS),
  paused: { title: 'issueReport.paused.title', body: 'issueReport.paused.body', blocked: 'issueReport.paused.blocked' },
  form: {
    heading: 'issueReport.form.heading',
    intro: 'issueReport.form.intro',
    draftRestored: 'issueReport.form.draftRestored',
    kind: 'issueReport.form.kind',
    severity: 'issueReport.form.severity',
    lockedSafety: 'issueReport.form.lockedSafety',
    about: 'issueReport.form.about',
    step: 'issueReport.form.step',
    noStep: 'issueReport.form.noStep',
    sopGap: 'issueReport.form.sopGap',
    sopGapHint: 'issueReport.form.sopGapHint',
    detail: 'issueReport.form.detail',
    description: 'issueReport.form.description',
    descriptionHint: 'issueReport.form.descriptionHint',
    descriptionOk: 'issueReport.form.descriptionOk',
    evidence: 'issueReport.form.evidence',
    evidenceHint: 'issueReport.form.evidenceHint',
    addPhoto: 'issueReport.form.addPhoto',
    addVideo: 'issueReport.form.addVideo',
    remove: 'issueReport.form.remove',
    related: 'issueReport.form.related',
    relatedHint: 'issueReport.form.relatedHint',
    relatedNone: 'issueReport.form.relatedNone',
    looksRelated: 'issueReport.form.looksRelated',
    send: 'issueReport.form.send',
    sendMissing: 'issueReport.form.sendMissing',
    safetyCall: 'issueReport.form.safetyCall',
    safetyDanger: 'issueReport.form.safetyDanger',
    closed: 'issueReport.form.closed',
    toast: 'issueReport.form.toast',
    toastQueued: 'issueReport.form.toastQueued',
  },
  confirm: { title: 'issueReport.confirm.title', blocking: 'issueReport.confirm.blocking', safety: 'issueReport.confirm.safety', go: 'issueReport.confirm.go', back: 'issueReport.confirm.back' },
  list: {
    open: 'issueReport.list.open',
    resolved: 'issueReport.list.resolved',
    empty: 'issueReport.list.empty',
    emptyResolved: 'issueReport.list.emptyResolved',
    step: 'issueReport.list.step',
    sopGap: 'issueReport.list.sopGap',
    by: 'issueReport.list.by',
    group: 'issueReport.list.group',
    resolvedBy: 'issueReport.list.resolvedBy',
    timeline: 'issueReport.list.timeline',
    hideTimeline: 'issueReport.list.hideTimeline',
    onJob: 'issueReport.list.onJob',
    openJob: 'issueReport.list.openJob',
  },
  resolution: rec('issueReport.resolution', RESOLUTION_IDS),
  event: rec('issueReport.event', ['reported', 'note', 'admin_note', 'severity', 'evidence', 'linked', 'resolved', 'reopened', 'paused', 'resumed'] as const),
  action: {
    note: 'issueReport.action.note',
    noteTitle: 'issueReport.action.noteTitle',
    noteLabel: 'issueReport.action.noteLabel',
    noteHint: 'issueReport.action.noteHint',
    send: 'issueReport.action.send',
    photo: 'issueReport.action.photo',
    severity: 'issueReport.action.severity',
    severityTitle: 'issueReport.action.severityTitle',
    severityRaiseOnly: 'issueReport.action.severityRaiseOnly',
    severityWhy: 'issueReport.action.severityWhy',
    apply: 'issueReport.action.apply',
    resolve: 'issueReport.action.resolve',
    resolveTitle: 'issueReport.action.resolveTitle',
    resolveHow: 'issueReport.action.resolveHow',
    resolveNote: 'issueReport.action.resolveNote',
    resolveSafetyAdmin: 'issueReport.action.resolveSafetyAdmin',
    resolveResumes: 'issueReport.action.resolveResumes',
    reopen: 'issueReport.action.reopen',
    reopenTitle: 'issueReport.action.reopenTitle',
    reopenNote: 'issueReport.action.reopenNote',
    toastResolved: 'issueReport.action.toastResolved',
    toastReopened: 'issueReport.action.toastReopened',
    toastNote: 'issueReport.action.toastNote',
    toastSeverity: 'issueReport.action.toastSeverity',
    toastReviewed: 'issueReport.action.toastReviewed',
  },
  board: {
    open: 'issueReport.board.open',
    resolved: 'issueReport.board.resolved',
    patterns: 'issueReport.board.patterns',
    totals: 'issueReport.board.totals',
    tOpen: 'issueReport.board.tOpen',
    tBlocking: 'issueReport.board.tBlocking',
    tSafety: 'issueReport.board.tSafety',
    tResolved: 'issueReport.board.tResolved',
    filterAll: 'issueReport.board.filterAll',
    emptyOpen: 'issueReport.board.emptyOpen',
    patternsIntro: 'issueReport.board.patternsIntro',
    patternsEmpty: 'issueReport.board.patternsEmpty',
    patternLine: 'issueReport.board.patternLine',
    needsReview: 'issueReport.board.needsReview',
    reviewed: 'issueReport.board.reviewed',
    review: 'issueReport.board.review',
    reviewTitle: 'issueReport.board.reviewTitle',
    reviewIntro: 'issueReport.board.reviewIntro',
    reviewOutcome: 'issueReport.board.reviewOutcome',
    reviewNote: 'issueReport.board.reviewNote',
    reviewNoteHint: 'issueReport.board.reviewNoteHint',
    reviewSave: 'issueReport.board.reviewSave',
    outcome: rec('issueReport.board.outcome', OUTCOMES),
    categories: 'issueReport.board.categories',
    categoriesIntro: 'issueReport.board.categoriesIntro',
    reportsOnStep: 'issueReport.board.reportsOnStep',
  },
  alert: { blocking: 'issueReport.alert.blocking', safety: 'issueReport.alert.safety', pattern: 'issueReport.alert.pattern' },
} as const;
