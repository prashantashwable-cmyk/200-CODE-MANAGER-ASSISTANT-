/** Screen 077 — Deal Closure Confirmation. Types and translation keys only. */

export type DealClosureConfirmationStatus = 'loading' | 'ready' | 'error';

export const DEAL_CLOSURE_CONFIRMATION_KEYS = {
  title: 'dealClosureConfirmation.title',
  loading: 'dealClosureConfirmation.loading',
  error: { title: 'dealClosureConfirmation.error.title', body: 'dealClosureConfirmation.error.body' },

  notReady: {
    title: 'dealClosureConfirmation.notReady.title',
    body: 'dealClosureConfirmation.notReady.body',
  },

  hero: {
    closedWon: 'dealClosureConfirmation.hero.closedWon',
    closedOn: 'dealClosureConfirmation.hero.closedOn',
    dealValue: 'dealClosureConfirmation.hero.dealValue',
  },

  nextSteps: {
    heading: 'dealClosureConfirmation.nextSteps.heading',
    subtitle: 'dealClosureConfirmation.nextSteps.subtitle',
    stageDue: 'dealClosureConfirmation.nextSteps.stageDue',
    delivery: 'dealClosureConfirmation.nextSteps.delivery',
    deliveryDays: 'dealClosureConfirmation.nextSteps.deliveryDays',
    deliveryEmerging: 'dealClosureConfirmation.nextSteps.deliveryEmerging',
  },

  contact: {
    heading: 'dealClosureConfirmation.contact.heading',
    role: 'dealClosureConfirmation.contact.role',
  },

  internalSummary: {
    heading: 'dealClosureConfirmation.internalSummary.heading',
    dealValue: 'dealClosureConfirmation.internalSummary.dealValue',
    commission: 'dealClosureConfirmation.internalSummary.commission',
    paymentSchedule: 'dealClosureConfirmation.internalSummary.paymentSchedule',
    paymentScheduleDone: 'dealClosureConfirmation.internalSummary.paymentScheduleDone',
    supplierPo: 'dealClosureConfirmation.internalSummary.supplierPo',
    supplierPoOk: 'dealClosureConfirmation.internalSummary.supplierPoOk',
    supplierPoFailed: 'dealClosureConfirmation.internalSummary.supplierPoFailed',
    viewCelebration: 'dealClosureConfirmation.internalSummary.viewCelebration',
  },

  voidAction: {
    button: 'dealClosureConfirmation.voidAction.button',
    sheetTitle: 'dealClosureConfirmation.voidAction.sheetTitle',
    sheetHint: 'dealClosureConfirmation.voidAction.sheetHint',
    reasonLabel: 'dealClosureConfirmation.voidAction.reasonLabel',
    submit: 'dealClosureConfirmation.voidAction.submit',
    voidedBanner: 'dealClosureConfirmation.voidAction.voidedBanner',
  },

  toast: {
    voided: 'dealClosureConfirmation.toast.voided',
    error: 'dealClosureConfirmation.toast.error',
  },
} as const;
