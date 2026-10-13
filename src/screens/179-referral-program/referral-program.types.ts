export const POLL_MS = 30_000;
export const REFERRALS_PATH = '/referrals';
export const referralLink = (origin: string, code: string): string => `${origin}/refer/${encodeURIComponent(code)}`;
export const whatsappShare = (text: string): string => `https://wa.me/?text=${encodeURIComponent(text)}`;
export const viewKey = (userId: string): string => `aiec.referralDesk.${userId}`;
export const inviteDraftKey = (userId: string): string => `aiec.referralDraft.${userId}`;
export const PHONE_DIGITS = 10;

export const REFERRAL_KEYS = {
  title: 'referral.title',
  subtitle: 'referral.subtitle',
  loading: 'referral.loading',
  error: {
    title: 'referral.error.title',
    body: 'referral.error.body',
  },
  refresh: 'referral.refresh',
  close: 'referral.close',
  link: {
    open: 'referral.link.open',
    hint: 'referral.link.hint',
  },
  notice: {
    placeholders: 'referral.notice.placeholders',
  },
  hero: {
    codeLabel: 'referral.hero.codeLabel',
    linkLabel: 'referral.hero.linkLabel',
    reward: 'referral.hero.reward',
  },
  share: {
    whatsapp: 'referral.share.whatsapp',
    copy: 'referral.share.copy',
    copied: 'referral.share.copied',
    more: 'referral.share.more',
    pageHeading: 'referral.share.pageHeading',
    message: 'referral.share.message',
  },
  terms: {
    title: 'referral.terms.title',
    you: 'referral.terms.you',
    friend: 'referral.terms.friend',
    when: 'referral.terms.when',
    known: 'referral.terms.known',
    version: 'referral.terms.version',
  },
  stats: {
    sent: 'referral.stats.sent',
    surveyed: 'referral.stats.surveyed',
    converted: 'referral.stats.converted',
    waiting: 'referral.stats.waiting',
  },
  earned: {
    title: 'referral.earned.title',
    issued: 'referral.earned.issued',
    paid: 'referral.earned.paid',
    inProgress: 'referral.earned.inProgress',
  },
  list: {
    title: 'referral.list.title',
    empty: {
      title: 'referral.list.empty.title',
      body: 'referral.list.empty.body',
    },
  },
  row: {
    via: {
      link: 'referral.row.via.link',
      invite: 'referral.row.via.invite',
    },
    sentOn: 'referral.row.sentOn',
  },
  status: {
    invited: 'referral.status.invited',
    surveying: 'referral.status.surveying',
    surveyed: 'referral.status.surveyed',
    converted: 'referral.status.converted',
    waiting: 'referral.status.waiting',
    closed: 'referral.status.closed',
    known: 'referral.status.known',
  },
  hint: {
    invited: 'referral.hint.invited',
    surveying: 'referral.hint.surveying',
    surveyed: 'referral.hint.surveyed',
    converted: 'referral.hint.converted',
    waiting: 'referral.hint.waiting',
    waitingNoDate: 'referral.hint.waitingNoDate',
    closed: 'referral.hint.closed',
    known: 'referral.hint.known',
  },
  reward: {
    projected: 'referral.reward.projected',
    being_checked: 'referral.reward.being_checked',
    held: 'referral.reward.held',
    ready: 'referral.reward.ready',
    sending: 'referral.reward.sending',
    failed: 'referral.reward.failed',
    paid: 'referral.reward.paid',
    taken_back: 'referral.reward.taken_back',
    amount: 'referral.reward.amount',
  },
  detail: {
    title: 'referral.detail.title',
    step: {
      invited: 'referral.detail.step.invited',
      surveying: 'referral.detail.step.surveying',
      surveyed: 'referral.detail.step.surveyed',
      converted: 'referral.detail.step.converted',
      reward: 'referral.detail.step.reward',
    },
    reference: 'referral.detail.reference',
  },
  invite: {
    open: 'referral.invite.open',
    title: 'referral.invite.title',
    body: 'referral.invite.body',
  },
  form: {
    name: 'referral.form.name',
    phone: 'referral.form.phone',
    city: 'referral.form.city',
    cityHint: 'referral.form.cityHint',
    note: 'referral.form.note',
    consent: 'referral.form.consent',
    consentOwn: 'referral.form.consentOwn',
    send: 'referral.form.send',
    cancel: 'referral.form.cancel',
  },
  sent: {
    received: 'referral.sent.received',
    knownBody: 'referral.sent.knownBody',
    knownShort: 'referral.sent.knownShort',
    another: 'referral.sent.another',
  },
  landing: {
    title: 'referral.landing.title',
    brand: 'referral.landing.brand',
    body: 'referral.landing.body',
    yourName: 'referral.landing.yourName',
    yourPhone: 'referral.landing.yourPhone',
    yourCity: 'referral.landing.yourCity',
    yourNote: 'referral.landing.yourNote',
    send: 'referral.landing.send',
    done: 'referral.landing.done',
    doneKnown: 'referral.landing.doneKnown',
    invalid: {
      title: 'referral.landing.invalid.title',
      body: 'referral.landing.invalid.body',
    },
    error: 'referral.landing.error',
  },
  alert: {
    newLead: 'referral.alert.newLead',
  },
  problem: {
    name_required: 'referral.problem.name_required',
    phone_invalid: 'referral.problem.phone_invalid',
    own_number: 'referral.problem.own_number',
    consent_required: 'referral.problem.consent_required',
    code_unknown: 'referral.problem.code_unknown',
    generic: 'referral.problem.generic',
  },
} as const;
