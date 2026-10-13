/** Screen 073 — Counter-Offer Approval. Types and translation keys only. */

export type CounterOfferApprovalStatus = 'loading' | 'ready' | 'error';

/** Hours a pending counter-offer can wait before the row's SLA badge turns
 *  urgent — matches the aging demonstrated by the seeded al-9 alert. */
export const SLA_WARNING_HOURS = 4;

export type DecisionSheetMode = 'reject' | 'counter';

export const COUNTER_OFFER_APPROVAL_KEYS = {
  title: 'counterOfferApproval.title',
  subtitle: 'counterOfferApproval.subtitle',
  loading: 'counterOfferApproval.loading',
  error: { title: 'counterOfferApproval.error.title', body: 'counterOfferApproval.error.body' },
  empty: { title: 'counterOfferApproval.empty.title', body: 'counterOfferApproval.empty.body' },

  row: {
    customerAsk: 'counterOfferApproval.row.customerAsk',
    standardPrice: 'counterOfferApproval.row.standardPrice',
    marginImpact: 'counterOfferApproval.row.marginImpact',
    companyFloor: 'counterOfferApproval.row.companyFloor',
    bundledConcession: 'counterOfferApproval.row.bundledConcession',
    consolidatedNote: 'counterOfferApproval.row.consolidatedNote',
    waiting: 'counterOfferApproval.row.waiting',
    slaBreached: 'counterOfferApproval.row.slaBreached',
  },

  actions: {
    approve: 'counterOfferApproval.actions.approve',
    reject: 'counterOfferApproval.actions.reject',
    counter: 'counterOfferApproval.actions.counter',
  },

  rejectSheet: {
    title: 'counterOfferApproval.rejectSheet.title',
    reasonLabel: 'counterOfferApproval.rejectSheet.reasonLabel',
    submit: 'counterOfferApproval.rejectSheet.submit',
  },

  counterSheet: {
    title: 'counterOfferApproval.counterSheet.title',
    priceLabel: 'counterOfferApproval.counterSheet.priceLabel',
    belowFloorWarning: 'counterOfferApproval.counterSheet.belowFloorWarning',
    submit: 'counterOfferApproval.counterSheet.submit',
  },

  toast: {
    approved: 'counterOfferApproval.toast.approved',
    rejected: 'counterOfferApproval.toast.rejected',
    countered: 'counterOfferApproval.toast.countered',
    error: 'counterOfferApproval.toast.error',
  },
} as const;
