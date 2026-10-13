/** Screen 091 — Supplier Directory & Onboarding Screen. Types and translation keys only. */

export type SupplierDirectoryStatus = 'loading' | 'ready' | 'error';

/** The known drive-type specialties — `driveType.*` is 061's own shared
 *  namespace, reused here rather than a second translated taxonomy. A
 *  supplier's own `driveTypeSpecialties` can hold values outside this
 *  list too (091's own edge case: a genuinely new specialty AIEC hasn't
 *  catalogued yet), which render as their own admin-authored text. */
export const KNOWN_DRIVE_TYPES = ['hydraulic', 'geared_traction', 'gearless_traction', 'mrl', 'vacuum', 'screw_driven'] as const;

/** Every other Module 10 screen Admin reaches from the directory. */
export const SUPPLIER_HUB = [
  { key: 'orders', path: '/orders' },
  { key: 'messages', path: '/supplier-messages' },
  { key: 'deliveries', path: '/deliveries' },
  { key: 'shipments', path: '/shipments' },
  { key: 'checklist', path: '/delivery-checklist' },
  { key: 'confirmations', path: '/delivery-confirmation' },
  { key: 'delays', path: '/delivery-delays' },
  { key: 'transit', path: '/stock-in-transit' },
  { key: 'sop', path: '/delivery-sop' },
  { key: 'damaged', path: '/damaged-parts' },
  { key: 'partners', path: '/delivery-partners' },
  { key: 'deliveryAnalytics', path: '/delivery-analytics' },
  { key: 'payments', path: '/supplier-payments' },
  { key: 'invoices', path: '/supplier-invoices' },
  { key: 'paymentSchedule', path: '/supplier-payment-schedule' },
  { key: 'paymentHistory', path: '/supplier-payment-history' },
  { key: 'gst', path: '/gst-compliance' },
  { key: 'disputes', path: '/supplier-disputes' },
  { key: 'exposure', path: '/advance-retention' },
  { key: 'paymentAnalytics', path: '/supplier-payment-analytics' },
  { key: 'paymentRelease', path: '/supplier-payment-release' },
  { key: 'agreements', path: '/agreement' },
  { key: 'scorecards', path: '/scorecard' },
  { key: 'paymentTerms', path: '/admin/suppliers/payment-terms' },
  { key: 'catalog', path: '/catalog' },
  { key: 'poRules', path: '/admin/suppliers/po-rules' },
] as const;

export const SUPPLIER_DIRECTORY_KEYS = {
  hub: {
    label: 'supplierDirectory.hub.label',
    orders: 'supplierDirectory.hub.orders',
    messages: 'supplierDirectory.hub.messages',
    deliveries: 'supplierDirectory.hub.deliveries',
    shipments: 'supplierDirectory.hub.shipments',
    checklist: 'supplierDirectory.hub.checklist',
    confirmations: 'supplierDirectory.hub.confirmations',
    delays: 'supplierDirectory.hub.delays',
    transit: 'supplierDirectory.hub.transit',
    sop: 'supplierDirectory.hub.sop',
    damaged: 'supplierDirectory.hub.damaged',
    partners: 'supplierDirectory.hub.partners',
    deliveryAnalytics: 'supplierDirectory.hub.deliveryAnalytics',
    payments: 'supplierDirectory.hub.payments',
    invoices: 'supplierDirectory.hub.invoices',
    paymentSchedule: 'supplierDirectory.hub.paymentSchedule',
    paymentHistory: 'supplierDirectory.hub.paymentHistory',
    gst: 'supplierDirectory.hub.gst',
    disputes: 'supplierDirectory.hub.disputes',
    exposure: 'supplierDirectory.hub.exposure',
    paymentAnalytics: 'supplierDirectory.hub.paymentAnalytics',
    paymentRelease: 'supplierDirectory.hub.paymentRelease',
    agreements: 'supplierDirectory.hub.agreements',
    scorecards: 'supplierDirectory.hub.scorecards',
    paymentTerms: 'supplierDirectory.hub.paymentTerms',
    catalog: 'supplierDirectory.hub.catalog',
    poRules: 'supplierDirectory.hub.poRules',
  },
  title: 'supplierDirectory.title',
  subtitle: 'supplierDirectory.subtitle',
  loading: 'supplierDirectory.loading',
  error: { title: 'supplierDirectory.error.title', body: 'supplierDirectory.error.body' },
  empty: { title: 'supplierDirectory.empty.title', body: 'supplierDirectory.empty.body' },
  noResults: { title: 'supplierDirectory.noResults.title', body: 'supplierDirectory.noResults.body' },

  searchPlaceholder: 'supplierDirectory.searchPlaceholder',
  filters: {
    specialtyAll: 'supplierDirectory.filters.specialtyAll',
    regionAll: 'supplierDirectory.filters.regionAll',
  },

  invite: 'supplierDirectory.invite',

  kyc: {
    pending: 'supplierDirectory.kyc.pending',
    approved: 'supplierDirectory.kyc.approved',
    rejected: 'supplierDirectory.kyc.rejected',
  },
  status: {
    active: 'supplierDirectory.status.active',
    pending_approval: 'supplierDirectory.status.pending_approval',
    suspended: 'supplierDirectory.status.suspended',
  },
  row: {
    eligible: 'supplierDirectory.row.eligible',
    notEligible: 'supplierDirectory.row.notEligible',
  },

  detail: {
    performanceScoreLabel: 'supplierDirectory.detail.performanceScoreLabel',
    viewCatalog: 'supplierDirectory.detail.viewCatalog',
    viewScorecard: 'supplierDirectory.detail.viewScorecard',
    viewAgreement: 'supplierDirectory.detail.viewAgreement',
    messages: 'supplierDirectory.detail.messages',
    manufacturer: 'supplierDirectory.detail.manufacturer',
    manufacturerHint: 'supplierDirectory.detail.manufacturerHint',
    contactLabel: 'supplierDirectory.detail.contactLabel',
    categoriesLabel: 'supplierDirectory.detail.categoriesLabel',
    specialtiesLabel: 'supplierDirectory.detail.specialtiesLabel',
    regionsLabel: 'supplierDirectory.detail.regionsLabel',
    suspendedNote: 'supplierDirectory.detail.suspendedNote',
    mergedNote: 'supplierDirectory.detail.mergedNote',
    approveKyc: 'supplierDirectory.detail.approveKyc',
    rejectKyc: 'supplierDirectory.detail.rejectKyc',
    suspend: 'supplierDirectory.detail.suspend',
    addSpecialty: 'supplierDirectory.detail.addSpecialty',
    mergeDuplicate: 'supplierDirectory.detail.mergeDuplicate',
  },

  inviteSheet: {
    title: 'supplierDirectory.inviteSheet.title',
    hint: 'supplierDirectory.inviteSheet.hint',
    nameLabel: 'supplierDirectory.inviteSheet.nameLabel',
    contactNameLabel: 'supplierDirectory.inviteSheet.contactNameLabel',
    contactPhoneLabel: 'supplierDirectory.inviteSheet.contactPhoneLabel',
    cityLabel: 'supplierDirectory.inviteSheet.cityLabel',
    categoriesLabel: 'supplierDirectory.inviteSheet.categoriesLabel',
    categoriesHint: 'supplierDirectory.inviteSheet.categoriesHint',
    specialtiesLabel: 'supplierDirectory.inviteSheet.specialtiesLabel',
    specialtiesHint: 'supplierDirectory.inviteSheet.specialtiesHint',
    regionsLabel: 'supplierDirectory.inviteSheet.regionsLabel',
    regionsHint: 'supplierDirectory.inviteSheet.regionsHint',
    submit: 'supplierDirectory.inviteSheet.submit',
  },

  suspendSheet: {
    title: 'supplierDirectory.suspendSheet.title',
    hint: 'supplierDirectory.suspendSheet.hint',
    reasonLabel: 'supplierDirectory.suspendSheet.reasonLabel',
    submit: 'supplierDirectory.suspendSheet.submit',
  },

  addSpecialtySheet: {
    title: 'supplierDirectory.addSpecialtySheet.title',
    hint: 'supplierDirectory.addSpecialtySheet.hint',
    specialtyLabel: 'supplierDirectory.addSpecialtySheet.specialtyLabel',
    submit: 'supplierDirectory.addSpecialtySheet.submit',
  },

  mergeSheet: {
    title: 'supplierDirectory.mergeSheet.title',
    hint: 'supplierDirectory.mergeSheet.hint',
    canonicalLabel: 'supplierDirectory.mergeSheet.canonicalLabel',
    submit: 'supplierDirectory.mergeSheet.submit',
  },

  toast: {
    invited: 'supplierDirectory.toast.invited',
    kycUpdated: 'supplierDirectory.toast.kycUpdated',
    suspended: 'supplierDirectory.toast.suspended',
    specialtyAdded: 'supplierDirectory.toast.specialtyAdded',
    merged: 'supplierDirectory.toast.merged',
    error: 'supplierDirectory.toast.error',
  },
} as const;
