/** Screen 064 — Quotation Preview (Customer-Facing). Types and translation keys only. */

export type QuotationPreviewStatus = 'loading' | 'ready' | 'error';

export const QUOTATION_PREVIEW_KEYS = {
  title: 'quotationPreview.title',
  loading: 'quotationPreview.loading',
  error: { title: 'quotationPreview.error.title', body: 'quotationPreview.error.body' },

  finalPriceLabel: 'quotationPreview.finalPriceLabel',
  gstInclusiveNote: 'quotationPreview.gstInclusiveNote',
  configSummary: 'quotationPreview.configSummary',
  validUntil: 'quotationPreview.validUntil',

  viewTracking: {
    notSent: 'quotationPreview.viewTracking.notSent',
    sentNotViewed: 'quotationPreview.viewTracking.sentNotViewed',
    viewed: 'quotationPreview.viewTracking.viewed',
  },

  expiredState: {
    title: 'quotationPreview.expiredState.title',
    body: 'quotationPreview.expiredState.body',
    requote: 'quotationPreview.expiredState.requote',
  },

  acceptedState: {
    title: 'quotationPreview.acceptedState.title',
    body: 'quotationPreview.acceptedState.body',
  },

  supersededState: {
    title: 'quotationPreview.supersededState.title',
    body: 'quotationPreview.supersededState.body',
  },

  actions: {
    accept: 'quotationPreview.actions.accept',
    requestChanges: 'quotationPreview.actions.requestChanges',
    send: 'quotationPreview.actions.send',
    deliveryStatus: 'quotationPreview.actions.deliveryStatus',
  },

  changeRequestSheet: {
    title: 'quotationPreview.changeRequestSheet.title',
    noteLabel: 'quotationPreview.changeRequestSheet.noteLabel',
    noteRequired: 'quotationPreview.changeRequestSheet.noteRequired',
    submit: 'quotationPreview.changeRequestSheet.submit',
  },

  toast: {
    accepted: 'quotationPreview.toast.accepted',
    changesRequested: 'quotationPreview.toast.changesRequested',
    requoted: 'quotationPreview.toast.requoted',
    error: 'quotationPreview.toast.error',
  },
} as const;
