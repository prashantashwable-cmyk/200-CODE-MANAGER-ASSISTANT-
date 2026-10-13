/** Screen 159 — New SOP Rollout Notification. Constants and translation keys only. */

import { AWAY_MAX_DAYS, MAX_QUESTIONS, MIN_NOTICE_DAYS, NOTE_MAX, OPTION_MAX, REASON_MIN, REMIND_GAP_HOURS, SUMMARY_MAX, SUMMARY_MIN, URGENT_ACK_HOURS } from '@/features/sop/rollout';

export { AWAY_MAX_DAYS, MAX_QUESTIONS, MIN_NOTICE_DAYS, NOTE_MAX, OPTION_MAX, REASON_MIN, REMIND_GAP_HOURS, SUMMARY_MAX, SUMMARY_MIN, URGENT_ACK_HOURS };
export const FILTERS = ['active', 'replaced'] as const;
export type Filter = (typeof FILTERS)[number];
export const ROLES = ['technician', 'surveyor', 'supplier'] as const;
export const STATUSES = ['unseen', 'seen', 'quiz_passed', 'complete'] as const;
export const CHANGE_KINDS = ['added', 'changed', 'removed'] as const;
export const PULL_DISTANCE = 70;
export const rolloutPath = (id: string) => `/sop-rollouts/${id}`;
export const boardPath = '/sop-rollouts';
export const draftKey = (userId: string) => `aiec.sopRolloutDraft.${userId}`;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const PROBLEMS = ['forbidden', 'not_admin', 'not_found', 'not_audience', 'quiz_required', 'not_seen', 'invalid_state', 'answers_required', 'no_pending', 'date_invalid', 'date_past', 'date_far', 'note_long', 'doc_unknown', 'version_unknown', 'roles_required', 'summary_required', 'summary_long', 'notice_short', 'already_announced', 'question_invalid', 'too_many_questions', 'reason_required', 'superseded', 'generic'] as const;

export const ROLLOUT_KEYS = {
  title: 'sopRollout.title',
  subtitle: 'sopRollout.subtitle',
  myTitle: 'sopRollout.myTitle',
  mySubtitle: 'sopRollout.mySubtitle',
  loading: 'sopRollout.loading',
  error: { title: 'sopRollout.error.title', body: 'sopRollout.error.body' },
  refresh: { button: 'sopRollout.refresh.button', pull: 'sopRollout.refresh.pull', release: 'sopRollout.refresh.release', busy: 'sopRollout.refresh.busy' },
  close: 'sopRollout.close',
  back: 'sopRollout.back',
  role: rec('sopRollout.role', ROLES),
  status: rec('sopRollout.status', STATUSES),
  statusBody: rec('sopRollout.statusBody', STATUSES),
  change: rec('sopRollout.change', CHANGE_KINDS),
  state: { upcoming: 'sopRollout.state.upcoming', in_force: 'sopRollout.state.in_force', replaced: 'sopRollout.state.replaced' },
  badge: { urgent: 'sopRollout.badge.urgent', correction: 'sopRollout.badge.correction', safety: 'sopRollout.badge.safety', away: 'sopRollout.badge.away', held: 'sopRollout.badge.held', overdue: 'sopRollout.badge.overdue', quiz: 'sopRollout.badge.quiz' },
  kpi: { active: 'sopRollout.kpi.active', activeCaption: 'sopRollout.kpi.activeCaption', waiting: 'sopRollout.kpi.waiting', waitingCaption: 'sopRollout.kpi.waitingCaption', overdue: 'sopRollout.kpi.overdue', overdueCaption: 'sopRollout.kpi.overdueCaption', away: 'sopRollout.kpi.away', awayCaption: 'sopRollout.kpi.awayCaption', held: 'sopRollout.kpi.held', heldCaption: 'sopRollout.kpi.heldCaption' },
  filter: { active: 'sopRollout.filter.active', replaced: 'sopRollout.filter.replaced' },
  board: {
    empty: 'sopRollout.board.empty', emptyBody: 'sopRollout.board.emptyBody', announce: 'sopRollout.board.announce', version: 'sopRollout.board.version', effective: 'sopRollout.board.effective', inForce: 'sopRollout.board.inForce',
    progress: 'sopRollout.board.progress', breakdown: 'sopRollout.board.breakdown', replacedBy: 'sopRollout.board.replacedBy', due: 'sopRollout.board.due', noneAudience: 'sopRollout.board.noneAudience', placeholder: 'sopRollout.board.placeholder',
    emptyReplaced: 'sopRollout.board.emptyReplaced',
  },
  compose: {
    title: 'sopRollout.compose.title', correctionTitle: 'sopRollout.compose.correctionTitle', body: 'sopRollout.compose.body', correctionBody: 'sopRollout.compose.correctionBody', doc: 'sopRollout.compose.doc', docPick: 'sopRollout.compose.docPick', version: 'sopRollout.compose.version',
    versionState: rec('sopRollout.compose.versionState', ['current', 'upcoming', 'past'] as const), announced: 'sopRollout.compose.announced', roles: 'sopRollout.compose.roles', rolesHint: 'sopRollout.compose.rolesHint', summary: 'sopRollout.compose.summary', summaryHint: 'sopRollout.compose.summaryHint',
    summaryPlaceholder: 'sopRollout.compose.summaryPlaceholder', urgent: 'sopRollout.compose.urgent', urgentHint: 'sopRollout.compose.urgentHint', effective: 'sopRollout.compose.effective', effectiveHint: 'sopRollout.compose.effectiveHint', reason: 'sopRollout.compose.reason', reasonHint: 'sopRollout.compose.reasonHint',
    changes: 'sopRollout.compose.changes', noChanges: 'sopRollout.compose.noChanges', safetyChanged: 'sopRollout.compose.safetyChanged',
    quiz: 'sopRollout.compose.quiz', quizHint: 'sopRollout.compose.quizHint', quizSuggest: 'sopRollout.compose.quizSuggest', question: 'sopRollout.compose.question', questionText: 'sopRollout.compose.questionText', option: 'sopRollout.compose.option', correct: 'sopRollout.compose.correct',
    addQuestion: 'sopRollout.compose.addQuestion', removeQuestion: 'sopRollout.compose.removeQuestion', addOption: 'sopRollout.compose.addOption', words: 'sopRollout.compose.words', send: 'sopRollout.compose.send', sendCorrection: 'sopRollout.compose.sendCorrection', cancel: 'sopRollout.compose.cancel', sent: 'sopRollout.compose.sent',
    noDocs: 'sopRollout.compose.noDocs',
  },
  detail: {
    summary: 'sopRollout.detail.summary', changes: 'sopRollout.detail.changes', people: 'sopRollout.detail.people', remind: 'sopRollout.detail.remind', reminded: 'sopRollout.detail.reminded', correct: 'sopRollout.detail.correct', openDoc: 'sopRollout.detail.openDoc',
    correctionOf: 'sopRollout.detail.correctionOf', correctionReason: 'sopRollout.detail.correctionReason', replacedBody: 'sopRollout.detail.replacedBody', gateBody: 'sopRollout.detail.gateBody', urgentBody: 'sopRollout.detail.urgentBody', key: 'sopRollout.detail.key', keyHint: 'sopRollout.detail.keyHint',
    sentBy: 'sopRollout.detail.sentBy', dueAt: 'sopRollout.detail.dueAt', acked: 'sopRollout.detail.acked', seen: 'sopRollout.detail.seen', attempts: 'sopRollout.detail.attempts', reminder: 'sopRollout.detail.reminder', markAway: 'sopRollout.detail.markAway', clearAway: 'sopRollout.detail.clearAway',
    awayUntil: 'sopRollout.detail.awayUntil', held: 'sopRollout.detail.held', allDone: 'sopRollout.detail.allDone', noPeople: 'sopRollout.detail.noPeople', correctionBody: 'sopRollout.detail.correctionBody',
  },
  away: { title: 'sopRollout.away.title', body: 'sopRollout.away.body', until: 'sopRollout.away.until', untilHint: 'sopRollout.away.untilHint', note: 'sopRollout.away.note', noteHint: 'sopRollout.away.noteHint', save: 'sopRollout.away.save', cancel: 'sopRollout.away.cancel' },
  mine: {
    pending: 'sopRollout.mine.pending', done: 'sopRollout.mine.done', none: 'sopRollout.mine.none', noneBody: 'sopRollout.mine.noneBody', due: 'sopRollout.mine.due', open: 'sopRollout.mine.open', heldBanner: 'sopRollout.mine.heldBanner',
  },
  read: {
    effective: 'sopRollout.read.effective', urgentBanner: 'sopRollout.read.urgentBanner', heldBanner: 'sopRollout.read.heldBanner', awayBanner: 'sopRollout.read.awayBanner', replacedBanner: 'sopRollout.read.replacedBanner', correctionBanner: 'sopRollout.read.correctionBanner',
    whatChanged: 'sopRollout.read.whatChanged', safetyNote: 'sopRollout.read.safetyNote', openDoc: 'sopRollout.read.openDoc', noDocForRole: 'sopRollout.read.noDocForRole', quizHeading: 'sopRollout.read.quizHeading', quizBody: 'sopRollout.read.quizBody', check: 'sopRollout.read.check',
    passed: 'sopRollout.read.passed', notYet: 'sopRollout.read.notYet', correctAnswer: 'sopRollout.read.correctAnswer', yourAnswer: 'sopRollout.read.yourAnswer', retry: 'sopRollout.read.retry', acknowledge: 'sopRollout.read.acknowledge', acknowledgeHint: 'sopRollout.read.acknowledgeHint',
    quizFirst: 'sopRollout.read.quizFirst', done: 'sopRollout.read.done', doneBody: 'sopRollout.read.doneBody', answerAll: 'sopRollout.read.answerAll', questionOf: 'sopRollout.read.questionOf', shownAsWritten: 'sopRollout.read.shownAsWritten', acknowledged: 'sopRollout.read.acknowledged',
  },
  alert: { overdue: 'sopRollout.alert.overdue' },
  problem: rec('sopRollout.problem', PROBLEMS),
} as const;
