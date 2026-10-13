/** Screen 160 — Training Feedback. Constants and translation keys only. */

import { COMMENT_MAX, LOW_AVERAGE, MIN_RESPONSES, NOTE_MIN, RATING_MAX, RATING_MIN, REASON_MIN, REVIEW_DUE_DAYS, SAFETY_DUE_HOURS, SERIOUS_MIN, URGENT_DUE_HOURS } from '@/features/training/feedback';

export { COMMENT_MAX, LOW_AVERAGE, MIN_RESPONSES, NOTE_MIN, RATING_MAX, RATING_MIN, REASON_MIN, REVIEW_DUE_DAYS, SAFETY_DUE_HOURS, SERIOUS_MIN, URGENT_DUE_HOURS };
export const RATINGS = [1, 2, 3, 4, 5] as const;
export const FILTERS = ['open', 'all', 'serious', 'hidden'] as const;
export type Filter = (typeof FILTERS)[number];
export const STATUSES = ['new', 'reviewing', 'addressed', 'dismissed'] as const;
export const PULL_DISTANCE = 70;
export const draftKey = (userId: string, moduleId: string) => `aiec.trainingFeedbackDraft.${userId}.${moduleId}`;
export const feedbackPath = (moduleId?: string) => (moduleId ? `/training-feedback/${moduleId}` : '/training-feedback');
export const lessonsPath = (moduleId: string) => `/training/${moduleId}`;
/** A quiz question's words live in 154's namespace (`assessmentContent.<code>.<id>.q`), shared by key. */
export const questionKey = (code: string, id: string) => `assessmentContent.${code.toLowerCase()}.${id}.q`;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const PROBLEMS = ['forbidden', 'not_admin', 'not_found', 'not_eligible', 'rating_required', 'comment_long', 'comment_required', 'target_unknown', 'reason_required', 'note_required', 'invalid_state', 'version_unknown', 'generic'] as const;

export const FEEDBACK_KEYS = {
  title: 'trainingFeedback.title',
  subtitle: 'trainingFeedback.subtitle',
  adminTitle: 'trainingFeedback.adminTitle',
  adminSubtitle: 'trainingFeedback.adminSubtitle',
  loading: 'trainingFeedback.loading',
  error: { title: 'trainingFeedback.error.title', body: 'trainingFeedback.error.body' },
  refresh: { button: 'trainingFeedback.refresh.button', pull: 'trainingFeedback.refresh.pull', release: 'trainingFeedback.refresh.release', busy: 'trainingFeedback.refresh.busy' },
  close: 'trainingFeedback.close',
  back: 'trainingFeedback.back',
  status: rec('trainingFeedback.status', STATUSES),
  list: {
    empty: 'trainingFeedback.list.empty', emptyBody: 'trainingFeedback.list.emptyBody', given: 'trainingFeedback.list.given', give: 'trainingFeedback.list.give', newer: 'trainingFeedback.list.newer', progress: rec('trainingFeedback.list.progress', ['in_progress', 'completed', 'update_needed'] as const),
    safety: 'trainingFeedback.list.safety', version: 'trainingFeedback.list.version',
  },
  form: {
    intro: 'trainingFeedback.form.intro', clarity: 'trainingFeedback.form.clarity', clarityHint: 'trainingFeedback.form.clarityHint', relevance: 'trainingFeedback.form.relevance', relevanceHint: 'trainingFeedback.form.relevanceHint',
    low: 'trainingFeedback.form.low', high: 'trainingFeedback.form.high', ratingOf: 'trainingFeedback.form.ratingOf', comment: 'trainingFeedback.form.comment', commentHint: 'trainingFeedback.form.commentHint', commentPlaceholder: 'trainingFeedback.form.commentPlaceholder',
    anonymous: 'trainingFeedback.form.anonymous', anonymousOn: 'trainingFeedback.form.anonymousOn', anonymousOff: 'trainingFeedback.form.anonymousOff', serious: 'trainingFeedback.form.serious', seriousHint: 'trainingFeedback.form.seriousHint', seriousNeeds: 'trainingFeedback.form.seriousNeeds',
    where: 'trainingFeedback.form.where', whereAll: 'trainingFeedback.form.whereAll', whereLesson: 'trainingFeedback.form.whereLesson', whereQuestion: 'trainingFeedback.form.whereQuestion', aboutQuestion: 'trainingFeedback.form.aboutQuestion', aboutLesson: 'trainingFeedback.form.aboutLesson',
    send: 'trainingFeedback.form.send', update: 'trainingFeedback.form.update', saved: 'trainingFeedback.form.saved', thanks: 'trainingFeedback.form.thanks', thanksBody: 'trainingFeedback.form.thanksBody', thanksSerious: 'trainingFeedback.form.thanksSerious',
    already: 'trainingFeedback.form.already', handled: 'trainingFeedback.form.handled', handledIn: 'trainingFeedback.form.handledIn', editAgain: 'trainingFeedback.form.editAgain', draftKept: 'trainingFeedback.form.draftKept', ready: 'trainingFeedback.form.ready', notReady: 'trainingFeedback.form.notReady',
  },
  link: { give: 'trainingFeedback.link.give', wrongQuestion: 'trainingFeedback.link.wrongQuestion', admin: 'trainingFeedback.link.admin' },
  kpi: { responses: 'trainingFeedback.kpi.responses', responsesCaption: 'trainingFeedback.kpi.responsesCaption', urgent: 'trainingFeedback.kpi.urgent', urgentCaption: 'trainingFeedback.kpi.urgentCaption', urgentNone: 'trainingFeedback.kpi.urgentNone', unreviewed: 'trainingFeedback.kpi.unreviewed', unreviewedCaption: 'trainingFeedback.kpi.unreviewedCaption', hidden: 'trainingFeedback.kpi.hidden', hiddenCaption: 'trainingFeedback.kpi.hiddenCaption' },
  admin: {
    urgentHeading: 'trainingFeedback.admin.urgentHeading', urgentBody: 'trainingFeedback.admin.urgentBody', modules: 'trainingFeedback.admin.modules', empty: 'trainingFeedback.admin.empty', emptyBody: 'trainingFeedback.admin.emptyBody',
    replies: 'trainingFeedback.admin.replies', rate: 'trainingFeedback.admin.rate', fewReplies: 'trainingFeedback.admin.fewReplies', noReplies: 'trainingFeedback.admin.noReplies', clarity: 'trainingFeedback.admin.clarity', relevance: 'trainingFeedback.admin.relevance',
    low: 'trainingFeedback.admin.low', openN: 'trainingFeedback.admin.openN', urgentN: 'trainingFeedback.admin.urgentN', byVersion: 'trainingFeedback.admin.byVersion', versionRow: 'trainingFeedback.admin.versionRow', versionFew: 'trainingFeedback.admin.versionFew',
    placeholder: 'trainingFeedback.admin.placeholder', anonymousNote: 'trainingFeedback.admin.anonymousNote',
  },
  item: {
    anonymous: 'trainingFeedback.item.anonymous', serious: 'trainingFeedback.item.serious', due: 'trainingFeedback.item.due', where: 'trainingFeedback.item.where', whole: 'trainingFeedback.item.whole', lesson: 'trainingFeedback.item.lesson', question: 'trainingFeedback.item.question',
    noComment: 'trainingFeedback.item.noComment', hidden: 'trainingFeedback.item.hidden', hiddenBy: 'trainingFeedback.item.hiddenBy', restore: 'trainingFeedback.item.restore', hide: 'trainingFeedback.item.hide', handle: 'trainingFeedback.item.handle', version: 'trainingFeedback.item.version',
    handledBy: 'trainingFeedback.item.handledBy', addressedIn: 'trainingFeedback.item.addressedIn', ratings: 'trainingFeedback.item.ratings', openLessons: 'trainingFeedback.item.openLessons',
  },
  filter: rec('trainingFeedback.filter', FILTERS),
  handle: {
    title: 'trainingFeedback.handle.title', status: 'trainingFeedback.handle.status', note: 'trainingFeedback.handle.note', noteHint: 'trainingFeedback.handle.noteHint', version: 'trainingFeedback.handle.version', versionNone: 'trainingFeedback.handle.versionNone',
    save: 'trainingFeedback.handle.save', cancel: 'trainingFeedback.handle.cancel', hideTitle: 'trainingFeedback.handle.hideTitle', hideBody: 'trainingFeedback.handle.hideBody', hideReason: 'trainingFeedback.handle.hideReason', hideReasonHint: 'trainingFeedback.handle.hideReasonHint', hideConfirm: 'trainingFeedback.handle.hideConfirm',
    done: 'trainingFeedback.handle.done',
  },
  alert: { error: 'trainingFeedback.alert.error' },
  problem: rec('trainingFeedback.problem', PROBLEMS),
} as const;
