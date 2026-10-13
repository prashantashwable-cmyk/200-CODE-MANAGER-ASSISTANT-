export const POLL_MS = 60_000;
export const FEEDBACK_PATH = '/feedback';
export const feedbackPath = (id: string) => `/feedback/${id}`;
export const viewKey = (userId: string) => `aiec.feedbackDesk.${userId}`;
export const draftKey = (userId: string, request: string) => `aiec.feedbackDraft.${userId}.${request}`;
export const RATINGS = [1, 2, 3, 4, 5] as const;

export const FEEDBACK_KEYS = {
  title: 'feedback.title',
  subtitle: {
    customer: 'feedback.subtitle.customer',
    admin: 'feedback.subtitle.admin',
  },
  loading: 'feedback.loading',
  error: {
    title: 'feedback.error.title',
    body: 'feedback.error.body',
  },
  refresh: 'feedback.refresh',
  close: 'feedback.close',
  back: 'feedback.back',
  notFound: 'feedback.notFound',
  link: {
    open: 'feedback.link.open',
  },
  notice: {
    placeholders: 'feedback.notice.placeholders',
  },
  ask: {
    title: 'feedback.ask.title',
    start: 'feedback.ask.start',
    later: 'feedback.ask.later',
    laterNote: 'feedback.ask.laterNote',
  },
  moment: {
    handover: {
      title: 'feedback.moment.handover.title',
      body: 'feedback.moment.handover.body',
      short: 'feedback.moment.handover.short',
    },
    ongoing: {
      title: 'feedback.moment.ongoing.title',
      body: 'feedback.moment.ongoing.body',
      short: 'feedback.moment.ongoing.short',
    },
    visit: {
      title: 'feedback.moment.visit.title',
      body: 'feedback.moment.visit.body',
      short: 'feedback.moment.visit.short',
    },
    people: 'feedback.moment.people',
  },
  none: {
    title: 'feedback.none.title',
    body: 'feedback.none.body',
  },
  upcoming: {
    title: 'feedback.upcoming.title',
    body: 'feedback.upcoming.body',
  },
  given: {
    title: 'feedback.given.title',
    empty: 'feedback.given.empty',
    followUp: {
      reaching_out: 'feedback.given.followUp.reaching_out',
      done: 'feedback.given.followUp.done',
    },
  },
  form: {
    overall: 'feedback.form.overall',
    dimensionsTitle: 'feedback.form.dimensionsTitle',
    dimensions: {
      hint: 'feedback.form.dimensions.hint',
    },
    commentLabel: 'feedback.form.commentLabel',
    comment: {
      hint: 'feedback.form.comment.hint',
    },
    note: 'feedback.form.note',
    submit: 'feedback.form.submit',
    sending: 'feedback.form.sending',
  },
  rating: {
    '1': 'feedback.rating.1',
    '2': 'feedback.rating.2',
    '3': 'feedback.rating.3',
    '4': 'feedback.rating.4',
    '5': 'feedback.rating.5',
  },
  dim: {
    installation: 'feedback.dim.installation',
    service: 'feedback.dim.service',
    communication: 'feedback.dim.communication',
    timeliness: 'feedback.dim.timeliness',
    value: 'feedback.dim.value',
  },
  thanks: {
    title: 'feedback.thanks.title',
    body: 'feedback.thanks.body',
    reach: 'feedback.thanks.reach',
    reachWeak: 'feedback.thanks.reachWeak',
    passed: 'feedback.thanks.passed',
    done: 'feedback.thanks.done',
  },
  problem: {
    overall_required: 'feedback.problem.overall_required',
    rating_invalid: 'feedback.problem.rating_invalid',
    dimension_unknown: 'feedback.problem.dimension_unknown',
    comment_long: 'feedback.problem.comment_long',
    not_due: 'feedback.problem.not_due',
    already_given: 'feedback.problem.already_given',
    note_short: 'feedback.problem.note_short',
    generic: 'feedback.problem.generic',
  },
  board: {
    filter: {
      outreach: 'feedback.board.filter.outreach',
      weak: 'feedback.board.filter.weak',
      staff: 'feedback.board.filter.staff',
      low: 'feedback.board.filter.low',
      all: 'feedback.board.filter.all',
    },
    empty: {
      title: 'feedback.board.empty.title',
      body: 'feedback.board.empty.body',
    },
    outreachDone: 'feedback.board.outreachDone',
  },
  flag: {
    negative: 'feedback.flag.negative',
    weak_dimension: 'feedback.flag.weak_dimension',
    staff_concern: 'feedback.flag.staff_concern',
  },
  sentiment: {
    positive: 'feedback.sentiment.positive',
  },
  summary: {
    title: 'feedback.summary.title',
    count: 'feedback.summary.count',
    avg: 'feedback.summary.avg',
    early: 'feedback.summary.early',
    byDimension: 'feedback.summary.byDimension',
    byPerson: 'feedback.summary.byPerson',
    person: 'feedback.summary.person',
    small: 'feedback.summary.small',
  },
  detail: {
    customer: 'feedback.detail.customer',
    call: 'feedback.detail.call',
    ratings: 'feedback.detail.ratings',
    overall: 'feedback.detail.overall',
    comment: 'feedback.detail.comment',
    noComment: 'feedback.detail.noComment',
    rated: 'feedback.detail.rated',
    mentioned: 'feedback.detail.mentioned',
    ticket: 'feedback.detail.ticket',
    outreach: {
      title: 'feedback.detail.outreach.title',
      body: 'feedback.detail.outreach.body',
      note: 'feedback.detail.outreach.note',
      save: 'feedback.detail.outreach.save',
      done: 'feedback.detail.outreach.done',
    },
    recognition: 'feedback.detail.recognition',
  },
  alert: {
    negative: 'feedback.alert.negative',
    staff: 'feedback.alert.staff',
  },
} as const;
