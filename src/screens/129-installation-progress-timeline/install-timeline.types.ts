/** Screen 129 — Installation Progress Timeline. Types and translation keys only. */

import type { InstallSopPhase } from '@/data/types';
import type { TimelineDelayReason, TimelineFreshness } from '@/data/repository';
import { PHASES } from '@/features/technician/timeline';

export type TimelineStatus = 'loading' | 'ready' | 'error' | 'not_found';

export const POLL_MS = 20_000;
export const viewKey = (userId: string, jobId: string) => `aiec.timelineView.${userId}.${jobId}`;
export const PHASE_IDS: InstallSopPhase[] = PHASES;
export const REASON_IDS: TimelineDelayReason[] = ['parts', 'site', 'readiness', 'safety', 'other', 'materials_pending', 'hold', 'pace'];
export const FRESH_IDS: TimelineFreshness[] = ['not_started', 'done', 'blocked', 'just_completed', 'quiet', 'in_progress'];

export const listPath = '/installation-timeline';
export const timelinePath = (id: string) => `/installation-timeline/${id}`;
export const jobPath = (id: string) => `/technician/jobs/${id}`;
export const homePathOf = (role: string | undefined) => (role === 'technician' ? '/technician' : role === 'customer' ? '/customer' : '/admin');

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const TIMELINE_KEYS = {
  title: 'installTimeline.title',
  listTitle: 'installTimeline.listTitle',
  loading: 'installTimeline.loading',
  back: 'installTimeline.back',
  offline: 'installTimeline.offline',
  certificate: 'installTimeline.certificate',
  error: { title: 'installTimeline.error.title', body: 'installTimeline.error.body' },
  notFound: { title: 'installTimeline.notFound.title', body: 'installTimeline.notFound.body', action: 'installTimeline.notFound.action' },
  empty: { title: 'installTimeline.empty.title', body: 'installTimeline.empty.body' },
  hidden: { title: 'installTimeline.hidden.title', body: 'installTimeline.hidden.body' },
  milestone: rec('installTimeline.milestone', PHASE_IDS),
  status: rec('installTimeline.status', ['done', 'current', 'upcoming', 'blocked'] as const),
  hero: rec('installTimeline.hero', FRESH_IDS),
  heroSub: rec('installTimeline.heroSub', FRESH_IDS),
  progress: { label: 'installTimeline.progress.label', steps: 'installTimeline.progress.steps' },
  estimate: {
    tileExpected: 'installTimeline.estimate.tileExpected',
    tileNotBefore: 'installTimeline.estimate.tileNotBefore',
    tileDone: 'installTimeline.estimate.tileDone',
    firstPlanned: 'installTimeline.estimate.firstPlanned',
    later: 'installTimeline.estimate.later',
    earlier: 'installTimeline.estimate.earlier',
    onTrack: 'installTimeline.estimate.onTrack',
    basisTypical: 'installTimeline.estimate.basisTypical',
    basisDefault: 'installTimeline.estimate.basisDefault',
    pace: 'installTimeline.estimate.pace',
    lastUpdate: 'installTimeline.estimate.lastUpdate',
    noUpdate: 'installTimeline.estimate.noUpdate',
  },
  reason: { heading: 'installTimeline.reason.heading', customer: rec('installTimeline.reason.customer', REASON_IDS), staff: rec('installTimeline.reason.staff', REASON_IDS), open: 'installTimeline.reason.open', past: 'installTimeline.reason.past' },
  rail: { heading: 'installTimeline.rail.heading', notBefore: 'installTimeline.rail.notBefore', doneOn: 'installTimeline.rail.doneOn', expectedOn: 'installTimeline.rail.expectedOn', firstPlanned: 'installTimeline.rail.firstPlanned', paused: 'installTimeline.rail.paused', stepsOf: 'installTimeline.rail.stepsOf', photos: 'installTimeline.rail.photos' },
  detail: {
    heading: 'installTimeline.detail.heading',
    note: 'installTimeline.detail.note',
    safety: 'installTimeline.detail.safety',
    notApplicable: 'installTimeline.detail.notApplicable',
    doneBy: 'installTimeline.detail.doneBy',
    evidence: 'installTimeline.detail.evidence',
    noEvidence: 'installTimeline.detail.noEvidence',
    issues: 'installTimeline.detail.issues',
    open: 'installTimeline.detail.open',
    resolved: 'installTimeline.detail.resolved',
    openIssues: 'installTimeline.detail.openIssues',
    noSteps: 'installTimeline.detail.noSteps',
    stepStatus: rec('installTimeline.detail.stepStatus', ['complete', 'current', 'upcoming', 'blocked'] as const),
  },
  team: { heading: 'installTimeline.team.heading', note: 'installTimeline.team.note', lead: 'installTimeline.team.lead', assistant: 'installTimeline.team.assistant', owned: 'installTimeline.team.owned', wholeJob: 'installTimeline.team.wholeJob', completedBy: 'installTimeline.team.completedBy', onSite: 'installTimeline.team.onSite' },
  events: { heading: 'installTimeline.events.heading', empty: 'installTimeline.events.empty', started: 'installTimeline.events.started', step_done: 'installTimeline.events.step_done', issue_reported: 'installTimeline.events.issue_reported', issue_resolved: 'installTimeline.events.issue_resolved', completed: 'installTimeline.events.completed', by: 'installTimeline.events.by' },
  visibility: {
    heading: 'installTimeline.visibility.heading',
    visible: 'installTimeline.visibility.visible',
    hiddenState: 'installTimeline.visibility.hiddenState',
    hide: 'installTimeline.visibility.hide',
    show: 'installTimeline.visibility.show',
    title: 'installTimeline.visibility.title',
    body: 'installTimeline.visibility.body',
    reason: 'installTimeline.visibility.reason',
    confirmHide: 'installTimeline.visibility.confirmHide',
    cancel: 'installTimeline.visibility.cancel',
    toastHidden: 'installTimeline.visibility.toastHidden',
    toastShown: 'installTimeline.visibility.toastShown',
    hiddenBy: 'installTimeline.visibility.hiddenBy',
    reasonRequired: 'installTimeline.visibility.reasonRequired',
  },
  customerNote: 'installTimeline.customerNote',
  list: { heading: 'installTimeline.list.heading', row: 'installTimeline.list.row', expected: 'installTimeline.list.expected', slip: 'installTimeline.list.slip', blocked: 'installTimeline.list.blocked', hiddenRow: 'installTimeline.list.hiddenRow', open: 'installTimeline.list.open' },
  jobStatus: rec('installTimeline.jobStatus', ['scheduled', 'materials_pending', 'in_progress', 'qc_pending', 'handover_pending', 'completed', 'on_hold'] as const),
} as const;
