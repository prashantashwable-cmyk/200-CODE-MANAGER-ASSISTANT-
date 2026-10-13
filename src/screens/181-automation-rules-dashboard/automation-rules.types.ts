export const POLL_MS = 15_000;
export const ROUTE = '/automation-rules';
export const MONITOR_ROUTE = '/admin/analytics/automation';
export const REASON_MIN = 10;
export const viewKey = (userId: string): string => `aiec.automationOverview.${userId}`;

export const AUTOMATION_RULES_KEYS = {
  title: 'automationRules.title',
  subtitle: 'automationRules.subtitle',
  loading: 'automationRules.loading',
  error: {
    title: 'automationRules.error.title',
    body: 'automationRules.error.body',
  },
  refresh: 'automationRules.refresh',
  close: 'automationRules.close',
  link: {
    monitor: 'automationRules.link.monitor',
    open: 'automationRules.link.open',
  },
  hero: {
    title: 'automationRules.hero.title',
    same: 'automationRules.hero.same',
    stat: {
      categories: 'automationRules.hero.stat.categories',
      rules: 'automationRules.hero.stat.rules',
      paused: 'automationRules.hero.stat.paused',
      attention: 'automationRules.hero.stat.attention',
      actions: 'automationRules.hero.stat.actions',
    },
  },
  paused: {
    title: 'automationRules.paused.title',
    line: 'automationRules.paused.line',
    resume: 'automationRules.paused.resume',
  },
  card: {
    rules: 'automationRules.card.rules',
    checks: 'automationRules.card.checks',
    lastAction: 'automationRules.card.lastAction',
    noAction: 'automationRules.card.noAction',
    actions: 'automationRules.card.actions',
    pause: 'automationRules.card.pause',
    paused: 'automationRules.card.paused',
    protected: 'automationRules.card.protected',
    protectedHint: 'automationRules.card.protectedHint',
    new: 'automationRules.card.new',
    open: 'automationRules.card.open',
    details: 'automationRules.card.details',
    attention: 'automationRules.card.attention',
  },
  category: {
    communications: {
      name: 'automationRules.category.communications.name',
      hint: 'automationRules.category.communications.hint',
    },
    payments: {
      name: 'automationRules.category.payments.name',
      hint: 'automationRules.category.payments.hint',
    },
    finance: {
      name: 'automationRules.category.finance.name',
      hint: 'automationRules.category.finance.hint',
    },
    suppliers: {
      name: 'automationRules.category.suppliers.name',
      hint: 'automationRules.category.suppliers.hint',
    },
    logistics: {
      name: 'automationRules.category.logistics.name',
      hint: 'automationRules.category.logistics.hint',
    },
    field: {
      name: 'automationRules.category.field.name',
      hint: 'automationRules.category.field.hint',
    },
    quality: {
      name: 'automationRules.category.quality.name',
      hint: 'automationRules.category.quality.hint',
    },
    training: {
      name: 'automationRules.category.training.name',
      hint: 'automationRules.category.training.hint',
    },
    recruitment: {
      name: 'automationRules.category.recruitment.name',
      hint: 'automationRules.category.recruitment.hint',
    },
    payouts: {
      name: 'automationRules.category.payouts.name',
      hint: 'automationRules.category.payouts.hint',
    },
    rewards: {
      name: 'automationRules.category.rewards.name',
      hint: 'automationRules.category.rewards.hint',
    },
    customerCare: {
      name: 'automationRules.category.customerCare.name',
      hint: 'automationRules.category.customerCare.hint',
    },
    commitments: {
      name: 'automationRules.category.commitments.name',
      hint: 'automationRules.category.commitments.hint',
    },
    custom: {
      name: 'automationRules.category.custom.name',
      hint: 'automationRules.category.custom.hint',
    },
    other: {
      name: 'automationRules.category.other.name',
      hint: 'automationRules.category.other.hint',
    },
    newHint: 'automationRules.category.newHint',
  },
  detail: {
    checks: 'automationRules.detail.checks',
    noChecks: 'automationRules.detail.noChecks',
    configured: 'automationRules.detail.configured',
    lastRun: 'automationRules.detail.lastRun',
    error: 'automationRules.detail.error',
    history: 'automationRules.detail.history',
    noHistory: 'automationRules.detail.noHistory',
    historyLine: 'automationRules.detail.historyLine',
    kind: {
      paused: 'automationRules.detail.kind.paused',
      resumed: 'automationRules.detail.kind.resumed',
    },
    skipped: 'automationRules.detail.skipped',
    reason: 'automationRules.detail.reason',
  },
  pause: {
    title: 'automationRules.pause.title',
    intro: 'automationRules.pause.intro',
    does: {
      title: 'automationRules.pause.does.title',
      '1': 'automationRules.pause.does.1',
      '2': 'automationRules.pause.does.2',
      '3': 'automationRules.pause.does.3',
    },
    doesnot: {
      title: 'automationRules.pause.doesnot.title',
      '1': 'automationRules.pause.doesnot.1',
      '2': 'automationRules.pause.doesnot.2',
      '3': 'automationRules.pause.doesnot.3',
      '4': 'automationRules.pause.doesnot.4',
    },
    resume: {
      title: 'automationRules.pause.resume.title',
      '1': 'automationRules.pause.resume.1',
    },
    affects: 'automationRules.pause.affects',
    reason: 'automationRules.pause.reason',
    reasonHint: 'automationRules.pause.reasonHint',
    confirm: 'automationRules.pause.confirm',
    cancel: 'automationRules.pause.cancel',
  },
  resume: {
    title: 'automationRules.resume.title',
    body: 'automationRules.resume.body',
    confirm: 'automationRules.resume.confirm',
  },
  toast: {
    paused: 'automationRules.toast.paused',
    resumed: 'automationRules.toast.resumed',
  },
  activity: {
    title: 'automationRules.activity.title',
    hint: 'automationRules.activity.hint',
    all: 'automationRules.activity.all',
    count: 'automationRules.activity.count',
    latest: 'automationRules.activity.latest',
    empty: 'automationRules.activity.empty',
  },
  notice: {
    placeholders: 'automationRules.notice.placeholders',
  },
  alert: {
    paused: 'automationRules.alert.paused',
    unitFailing: 'automationRules.alert.unitFailing',
  },
  problem: {
    reason_short: 'automationRules.problem.reason_short',
    already_paused: 'automationRules.problem.already_paused',
    not_paused: 'automationRules.problem.not_paused',
    protected_category: 'automationRules.problem.protected_category',
    unknown_category: 'automationRules.problem.unknown_category',
    forbidden: 'automationRules.problem.forbidden',
    generic: 'automationRules.problem.generic',
  },
} as const;
