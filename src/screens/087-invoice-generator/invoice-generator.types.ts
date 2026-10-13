/** Screen 087 — Invoice Generator Screen. Types and translation keys only. */

export type InvoiceGeneratorStatus = 'loading' | 'ready' | 'not_found' | 'error';

export const INVOICE_GENERATOR_KEYS = {
  title: 'invoiceGenerator.title',
  loading: 'invoiceGenerator.loading',
  notFound: { title: 'invoiceGenerator.notFound.title', body: 'invoiceGenerator.notFound.body' },
  error: { title: 'invoiceGenerator.error.title', body: 'invoiceGenerator.error.body' },
  empty: { title: 'invoiceGenerator.empty.title', body: 'invoiceGenerator.empty.body' },

  hero: {
    agreedPrice: 'invoiceGenerator.hero.agreedPrice',
    allPaid: 'invoiceGenerator.hero.allPaid',
  },

  gstin: {
    heading: 'invoiceGenerator.gstin.heading',
    aiec: 'invoiceGenerator.gstin.aiec',
    customer: 'invoiceGenerator.gstin.customer',
    notSet: 'invoiceGenerator.gstin.notSet',
    add: 'invoiceGenerator.gstin.add',
    inputLabel: 'invoiceGenerator.gstin.inputLabel',
    save: 'invoiceGenerator.gstin.save',
  },

  finalInvoice: {
    heading: 'invoiceGenerator.finalInvoice.heading',
    body: 'invoiceGenerator.finalInvoice.body',
    notReady: 'invoiceGenerator.finalInvoice.notReady',
    generate: 'invoiceGenerator.finalInvoice.generate',
  },

  type: {
    stage: 'invoiceGenerator.type.stage',
    final: 'invoiceGenerator.type.final',
    credit_note: 'invoiceGenerator.type.credit_note',
    reissue: 'invoiceGenerator.type.reissue',
  },

  list: {
    heading: 'invoiceGenerator.list.heading',
    superseded: 'invoiceGenerator.list.superseded',
  },

  detail: {
    billedTo: 'invoiceGenerator.detail.billedTo',
    gstinLabel: 'invoiceGenerator.detail.gstinLabel',
    issuedOn: 'invoiceGenerator.detail.issuedOn',
    stageLine: 'invoiceGenerator.detail.stageLine',
    finalLine: 'invoiceGenerator.detail.finalLine',
    creditNoteLine: 'invoiceGenerator.detail.creditNoteLine',
    reissueLine: 'invoiceGenerator.detail.reissueLine',
    taxableValue: 'invoiceGenerator.detail.taxableValue',
    gstAt: 'invoiceGenerator.detail.gstAt',
    total: 'invoiceGenerator.detail.total',
    supersededNote: 'invoiceGenerator.detail.supersededNote',
    referencesNote: 'invoiceGenerator.detail.referencesNote',
    print: 'invoiceGenerator.detail.print',
    issueCreditNote: 'invoiceGenerator.detail.issueCreditNote',
    reissue: 'invoiceGenerator.detail.reissue',
  },

  creditNoteSheet: {
    title: 'invoiceGenerator.creditNoteSheet.title',
    hint: 'invoiceGenerator.creditNoteSheet.hint',
    amountLabel: 'invoiceGenerator.creditNoteSheet.amountLabel',
    reasonLabel: 'invoiceGenerator.creditNoteSheet.reasonLabel',
    submit: 'invoiceGenerator.creditNoteSheet.submit',
  },

  reissueSheet: {
    title: 'invoiceGenerator.reissueSheet.title',
    hint: 'invoiceGenerator.reissueSheet.hint',
    reasonLabel: 'invoiceGenerator.reissueSheet.reasonLabel',
    submit: 'invoiceGenerator.reissueSheet.submit',
  },

  toast: {
    generated: 'invoiceGenerator.toast.generated',
    gstinSaved: 'invoiceGenerator.toast.gstinSaved',
    creditNoted: 'invoiceGenerator.toast.creditNoted',
    reissued: 'invoiceGenerator.toast.reissued',
    error: 'invoiceGenerator.toast.error',
  },
} as const;
