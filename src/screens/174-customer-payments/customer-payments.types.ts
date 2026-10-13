export const POLL_MS = 30_000;
/** While a payment is being confirmed the page looks again sooner, so "confirming" becomes "paid" without a refresh. */
export const CONFIRMING_POLL_MS = 6_000;
export const PAYMENTS_PATH = '/my-payments';
export const historyPath = '/payments/history';
export const receiptsPath = '/documents?kind=receipt';
export const receiptPath = (docId: string) => `/documents?doc=${docId}`;
export const checkoutPath = (paymentId: string) => `/customer/payments/${paymentId}/checkout`;
export const loanPath = (dealId: string) => `/customer/deals/${dealId}/loan-application`;
export const viewKey = (userId: string, deal: string) => `aiec.customerPayments.${userId}.${deal || 'first'}`;

export const PAYMENT_KEYS = {
  title: 'customerPayments.title',
  subtitle: 'customerPayments.subtitle',
  loading: 'customerPayments.loading',
  error: {
    title: 'customerPayments.error.title',
    body: 'customerPayments.error.body',
  },
  offline: 'customerPayments.offline',
  refresh: 'customerPayments.refresh',
  close: 'customerPayments.close',
  empty: {
    title: 'customerPayments.empty.title',
    body: 'customerPayments.empty.body',
  },
  project: {
    separate: 'customerPayments.project.separate',
  },
  hero: {
    overdue: {
      title: 'customerPayments.hero.overdue.title',
      body: 'customerPayments.hero.overdue.body',
    },
    due: {
      title: 'customerPayments.hero.due.title',
      body: 'customerPayments.hero.due.body',
    },
    confirming: {
      title: 'customerPayments.hero.confirming.title',
      body: 'customerPayments.hero.confirming.body',
    },
    disputed: {
      title: 'customerPayments.hero.disputed.title',
      body: 'customerPayments.hero.disputed.body',
    },
    upcoming: {
      title: 'customerPayments.hero.upcoming.title',
      body: 'customerPayments.hero.upcoming.body',
    },
    complete: {
      title: 'customerPayments.hero.complete.title',
      body: 'customerPayments.hero.complete.body',
    },
    empty: {
      title: 'customerPayments.hero.empty.title',
      body: 'customerPayments.hero.empty.body',
    },
    payNow: 'customerPayments.hero.payNow',
    forStage: 'customerPayments.hero.forStage',
  },
  summary: {
    paid: 'customerPayments.summary.paid',
    total: 'customerPayments.summary.total',
    remaining: 'customerPayments.summary.remaining',
    percent: 'customerPayments.summary.percent',
    inQuestion: 'customerPayments.summary.inQuestion',
  },
  held: {
    body: 'customerPayments.held.body',
  },
  section: {
    schedule: 'customerPayments.section.schedule',
    received: 'customerPayments.section.received',
    loan: 'customerPayments.section.loan',
    reminders: 'customerPayments.section.reminders',
    help: 'customerPayments.section.help',
  },
  stage: {
    advance: 'customerPayments.stage.advance',
    material: 'customerPayments.stage.material',
    installation: 'customerPayments.stage.installation',
    handover: 'customerPayments.stage.handover',
    retention: 'customerPayments.stage.retention',
  },
  state: {
    paid: 'customerPayments.state.paid',
    confirming: 'customerPayments.state.confirming',
    overdue: 'customerPayments.state.overdue',
    due: 'customerPayments.state.due',
    upcoming: 'customerPayments.state.upcoming',
    disputed: 'customerPayments.state.disputed',
    refunded: 'customerPayments.state.refunded',
  },
  row: {
    dueOn: 'customerPayments.row.dueOn',
    paidOn: 'customerPayments.row.paidOn',
    partial: 'customerPayments.row.partial',
    raised: 'customerPayments.row.raised',
    raisedNoDate: 'customerPayments.row.raisedNoDate',
    confirming: 'customerPayments.row.confirming',
    refund: 'customerPayments.row.refund',
    pay: 'customerPayments.row.pay',
  },
  detail: {
    amount: 'customerPayments.detail.amount',
    received: 'customerPayments.detail.received',
    remaining: 'customerPayments.detail.remaining',
    due: 'customerPayments.detail.due',
    paidOn: 'customerPayments.detail.paidOn',
    method: 'customerPayments.detail.method',
    reference: 'customerPayments.detail.reference',
    receipt: 'customerPayments.detail.receipt',
    pay: 'customerPayments.detail.pay',
    call: 'customerPayments.detail.call',
    confirming: {
      gateway: 'customerPayments.detail.confirming.gateway',
      bank: 'customerPayments.detail.confirming.bank',
    },
    dispute: {
      open: 'customerPayments.detail.dispute.open',
      rejected: 'customerPayments.detail.dispute.rejected',
      full_refund: 'customerPayments.detail.dispute.full_refund',
      partial_refund: 'customerPayments.detail.dispute.partial_refund',
    },
    later: 'customerPayments.detail.later',
  },
  loan: {
    available: {
      body: 'customerPayments.loan.available.body',
      cta: 'customerPayments.loan.available.cta',
    },
    in_progress: {
      body: 'customerPayments.loan.in_progress.body',
    },
    approved: {
      body: 'customerPayments.loan.approved.body',
    },
    disbursed: {
      body: 'customerPayments.loan.disbursed.body',
    },
    view: 'customerPayments.loan.view',
  },
  reminders: {
    line: 'customerPayments.reminders.line',
    none: 'customerPayments.reminders.none',
    paused: 'customerPayments.reminders.paused',
    body: 'customerPayments.reminders.body',
  },
  received: {
    empty: 'customerPayments.received.empty',
    history: 'customerPayments.received.history',
    documents: 'customerPayments.received.documents',
  },
  help: {
    body: 'customerPayments.help.body',
  },
  link: {
    open: 'customerPayments.link.open',
  },
} as const;
