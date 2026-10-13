/** Screen 092 — Purchase Order Generator Screen. Types and translation keys only. */

export type PurchaseOrderGeneratorStatus = 'loading' | 'ready' | 'error';

export const PURCHASE_ORDER_GENERATOR_KEYS = {
  title: 'purchaseOrderGenerator.title',
  loading: 'purchaseOrderGenerator.loading',
  error: { title: 'purchaseOrderGenerator.error.title', body: 'purchaseOrderGenerator.error.body' },
  notReady: { title: 'purchaseOrderGenerator.notReady.title', body: 'purchaseOrderGenerator.notReady.body' },
  empty: { title: 'purchaseOrderGenerator.empty.title', body: 'purchaseOrderGenerator.empty.body' },
  hold: {
    automation_off: { title: 'purchaseOrderGenerator.hold.automation_off.title', body: 'purchaseOrderGenerator.hold.automation_off.body' },
    awaiting_first_payment: {
      title: 'purchaseOrderGenerator.hold.awaiting_first_payment.title',
      body: 'purchaseOrderGenerator.hold.awaiting_first_payment.body',
    },
    draftNow: 'purchaseOrderGenerator.hold.draftNow',
  },
  rulesLink: 'purchaseOrderGenerator.rulesLink',

  status: {
    triggered: 'purchaseOrderGenerator.status.triggered',
    failed: 'purchaseOrderGenerator.status.failed',
    draft: 'purchaseOrderGenerator.status.draft',
    pending_approval: 'purchaseOrderGenerator.status.pending_approval',
    approved: 'purchaseOrderGenerator.status.approved',
    sent: 'purchaseOrderGenerator.status.sent',
  },

  po: {
    supplierLabel: 'purchaseOrderGenerator.po.supplierLabel',
    notEligible: 'purchaseOrderGenerator.po.notEligible',
    agreementBlocked: 'purchaseOrderGenerator.po.agreementBlocked',
    viewAgreement: 'purchaseOrderGenerator.po.viewAgreement',
    reassign: 'purchaseOrderGenerator.po.reassign',
    deliveryLabel: 'purchaseOrderGenerator.po.deliveryLabel',
    totalLabel: 'purchaseOrderGenerator.po.totalLabel',
    approvalNeeded: 'purchaseOrderGenerator.po.approvalNeeded',
    approvalOverValue: 'purchaseOrderGenerator.po.approvalOverValue',
    approvePricing: 'purchaseOrderGenerator.po.approvePricing',
    send: 'purchaseOrderGenerator.po.send',
    sentNote: 'purchaseOrderGenerator.po.sentNote',
    track: 'purchaseOrderGenerator.po.track',
  },

  line: {
    quantityLabel: 'purchaseOrderGenerator.line.quantityLabel',
    catalogPriceLabel: 'purchaseOrderGenerator.line.catalogPriceLabel',
    agreedPriceLabel: 'purchaseOrderGenerator.line.agreedPriceLabel',
    priceChanged: 'purchaseOrderGenerator.line.priceChanged',
    whyAssigned: 'purchaseOrderGenerator.line.whyAssigned',
    whyBest: 'purchaseOrderGenerator.line.whyBest',
    whyOnly: 'purchaseOrderGenerator.line.whyOnly',
    driveTypeFallback: 'purchaseOrderGenerator.line.driveTypeFallback',
  },

  reassignSheet: {
    title: 'purchaseOrderGenerator.reassignSheet.title',
    hint: 'purchaseOrderGenerator.reassignSheet.hint',
    supplierLabel: 'purchaseOrderGenerator.reassignSheet.supplierLabel',
    submit: 'purchaseOrderGenerator.reassignSheet.submit',
  },

  toast: {
    lineUpdated: 'purchaseOrderGenerator.toast.lineUpdated',
    reassigned: 'purchaseOrderGenerator.toast.reassigned',
    deliverySet: 'purchaseOrderGenerator.toast.deliverySet',
    approved: 'purchaseOrderGenerator.toast.approved',
    sent: 'purchaseOrderGenerator.toast.sent',
    drafted: 'purchaseOrderGenerator.toast.drafted',
    error: 'purchaseOrderGenerator.toast.error',
  },
} as const;
