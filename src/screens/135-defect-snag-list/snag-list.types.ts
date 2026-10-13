/** Screen 135 — Defect / Snag List. Types and translation keys only. */

import type { DisputeDecision, SnagSeverity } from '@/features/qc/snags';
import { SEVERITIES } from '@/features/qc/snags';

export type SnagListStatus = 'loading' | 'ready' | 'error' | 'not_found';
export const POLL_MS = 15_000;
export const PAGE = 10;
export const STATUS_FILTERS = ['open', 'pending', 'disputed', 'closed', 'all'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];
export const SEVERITY_LIST: SnagSeverity[] = SEVERITIES;
export const DECISIONS: DisputeDecision[] = ['finding_stands', 'retest_ordered', 'finding_withdrawn'];

export const FINAL_ERRORS = [
  'title_required', 'note_required', 'evidence_required', 'reason_required', 'cannot_lower', 'not_cosmetic', 'waiver_by_required', 'waiver_note_required', 'cannot_withdraw',
  'decision_note_required', 'link_needs_two', 'link_not_manual', 'link_other_job', 'link_closed', 'primary_not_in_group', 'link_note_required', 'not_owner', 'invalid_state',
  'not_ready_for_verification', 'checklist_snag', 'self_verify', 'no_owner', 'not_found', 'forbidden', 'not_ready', 'too_many_attachments', 'not_technician',
  'video_too_large', 'video_too_long', 'wrong_kind', 'not_a_video', 'not_a_photo',
] as const;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
export const boardPath = '/snags';
export const snagPath = (jobId: string, snagId: string) => `/snags/${jobId}?snag=${snagId}`;

export const SNAG_KEYS = {
  title: 'snagList.title',
  loading: 'snagList.loading',
  back: 'snagList.back',
  offline: 'snagList.offline',
  error: { title: 'snagList.error.title', body: 'snagList.error.body' },
  notFound: { title: 'snagList.notFound.title', body: 'snagList.notFound.body', action: 'snagList.notFound.action' },
  empty: { title: 'snagList.empty.title', body: 'snagList.empty.body', filtered: 'snagList.empty.filtered', filteredBody: 'snagList.empty.filteredBody', clear: 'snagList.empty.clear' },
  problem: rec('snagList.problem', [...FINAL_ERRORS, 'offline', 'generic'] as const),
  severity: rec('snagList.severity', SEVERITIES),
  severityHint: rec('snagList.severityHint', SEVERITIES),
  status: rec('snagList.status', ['open', 'assigned', 'in_progress', 'ready_for_retest', 'disputed', 'verified', 'waived', 'withdrawn'] as const),
  stat: { open: 'snagList.stat.open', blocking: 'snagList.stat.blocking', pending: 'snagList.stat.pending', disputed: 'snagList.stat.disputed' },
  block: { title: 'snagList.block.title', body: 'snagList.block.body' },
  filter: { label: 'snagList.filter.label', search: 'snagList.filter.search', severityAll: 'snagList.filter.severityAll', job: 'snagList.filter.job', jobAll: 'snagList.filter.jobAll', status: rec('snagList.filter.status', STATUS_FILTERS) },
  section: { count: 'snagList.section.count', more: 'snagList.section.more' },
  row: {
    mechanical: 'snagList.row.mechanical',
    electrical: 'snagList.row.electrical',
    manual: 'snagList.row.manual',
    raised: 'snagList.row.raised',
    overdue: 'snagList.row.overdue',
    due: 'snagList.row.due',
    owner: 'snagList.row.owner',
    unassigned: 'snagList.row.unassigned',
    linked: 'snagList.row.linked',
    blocking: 'snagList.row.blocking',
    select: 'snagList.row.select',
  },
  select: { count: 'snagList.select.count', clear: 'snagList.select.clear', assign: 'snagList.select.assign', link: 'snagList.select.link' },
  add: {
    open: 'snagList.add.open',
    title: 'snagList.add.title',
    job: 'snagList.add.job',
    name: 'snagList.add.name',
    nameHint: 'snagList.add.nameHint',
    severity: 'snagList.add.severity',
    note: 'snagList.add.note',
    noteHint: 'snagList.add.noteHint',
    evidence: 'snagList.add.evidence',
    evidenceHint: 'snagList.add.evidenceHint',
    evidenceSafety: 'snagList.add.evidenceSafety',
    addPhoto: 'snagList.add.addPhoto',
    addVideo: 'snagList.add.addVideo',
    remove: 'snagList.add.remove',
    go: 'snagList.add.go',
    toast: 'snagList.add.toast',
  },
  detail: {
    job: 'snagList.detail.job',
    source: rec('snagList.detail.source', ['qc_mechanical', 'qc_electrical', 'snag'] as const),
    raised: 'snagList.detail.raised',
    owner: 'snagList.detail.owner',
    due: 'snagList.detail.due',
    unassigned: 'snagList.detail.unassigned',
    note: 'snagList.detail.note',
    evidence: 'snagList.detail.evidence',
    noEvidence: 'snagList.detail.noEvidence',
    blocking: 'snagList.detail.blocking',
    groupHeading: 'snagList.detail.groupHeading',
    groupPrimary: 'snagList.detail.groupPrimary',
    groupRule: 'snagList.detail.groupRule',
    disputeHeading: 'snagList.detail.disputeHeading',
    disputeBy: 'snagList.detail.disputeBy',
    decisionBy: 'snagList.detail.decisionBy',
    waiverHeading: 'snagList.detail.waiverHeading',
    waiverBy: 'snagList.detail.waiverBy',
    waiverNote: 'snagList.detail.waiverNote',
    waiverFoot: 'snagList.detail.waiverFoot',
    verified: 'snagList.detail.verified',
    resolvedVia: 'snagList.detail.resolvedVia',
    timeline: 'snagList.detail.timeline',
    recheck: 'snagList.detail.recheck',
    recheckHint: 'snagList.detail.recheckHint',
    pendingHint: 'snagList.detail.pendingHint',
    rework: 'snagList.detail.rework',
    actions: 'snagList.detail.actions',
    event: rec('snagList.detail.event', ['raised', 'failed_again', 'assigned', 'reassigned', 'handed_back', 'rework_started', 'escalated', 'part_requested', 'part_ordered', 'regraded', 'linked', 'disputed', 'dispute_decided', 'ready_for_retest', 'verified', 'waived', 'withdrawn'] as const),
  },
  assign: { title: 'snagList.assign.title', body: 'snagList.assign.body', tech: 'snagList.assign.tech', choose: 'snagList.assign.choose', due: rec('snagList.assign.due', SEVERITIES), go: 'snagList.assign.go', toast: 'snagList.assign.toast', open: 'snagList.assign.open', reassign: 'snagList.assign.reassign' },
  regrade: { open: 'snagList.regrade.open', title: 'snagList.regrade.title', to: 'snagList.regrade.to', reason: 'snagList.regrade.reason', hint: 'snagList.regrade.hint', go: 'snagList.regrade.go', toast: 'snagList.regrade.toast' },
  link: { title: 'snagList.link.title', body: 'snagList.link.body', primary: 'snagList.link.primary', note: 'snagList.link.note', noteHint: 'snagList.link.noteHint', go: 'snagList.link.go', toast: 'snagList.link.toast' },
  dispute: { open: 'snagList.dispute.open', title: 'snagList.dispute.title', body: 'snagList.dispute.body', reason: 'snagList.dispute.reason', hint: 'snagList.dispute.hint', go: 'snagList.dispute.go', toast: 'snagList.dispute.toast' },
  decide: {
    open: 'snagList.decide.open',
    title: 'snagList.decide.title',
    kind: rec('snagList.decide.kind', DECISIONS),
    kindHint: rec('snagList.decide.kindHint', DECISIONS),
    note: 'snagList.decide.note',
    hint: 'snagList.decide.hint',
    go: 'snagList.decide.go',
    toast: 'snagList.decide.toast',
    locked: 'snagList.decide.locked',
  },
  waive: { open: 'snagList.waive.open', title: 'snagList.waive.title', body: 'snagList.waive.body', by: 'snagList.waive.by', byHint: 'snagList.waive.byHint', note: 'snagList.waive.note', noteHint: 'snagList.waive.noteHint', go: 'snagList.waive.go', toast: 'snagList.waive.toast' },
  verify: { open: 'snagList.verify.open', title: 'snagList.verify.title', body: 'snagList.verify.body', note: 'snagList.verify.note', go: 'snagList.verify.go', toast: 'snagList.verify.toast', self: 'snagList.verify.self' },
  alert: { safety: 'snagList.alert.safety' },
  cancel: 'snagList.cancel',
} as const;
