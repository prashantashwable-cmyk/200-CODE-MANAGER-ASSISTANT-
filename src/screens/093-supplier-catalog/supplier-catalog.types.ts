/** Screen 093 — Supplier Catalog & Parts Pricing. Types and translation keys only. */

export type SupplierCatalogStatus = 'loading' | 'ready' | 'error' | 'no_supplier';

/** Live listings, anything waiting on Admin, and what's no longer offered. */
export type CatalogView = 'active' | 'review' | 'discontinued';

export const CATALOG_VIEWS: CatalogView[] = ['active', 'review', 'discontinued'];

/** Long lines of products are real (a component maker can list hundreds) —
 *  the list pages rather than rendering them all at once. */
export const CATALOG_PAGE_SIZE = 20;

export const SUPPLIER_CATALOG_KEYS = {
  title: 'supplierCatalog.title',
  subtitle: 'supplierCatalog.subtitle',
  subtitleSupplier: 'supplierCatalog.subtitleSupplier',
  loading: 'supplierCatalog.loading',
  error: { title: 'supplierCatalog.error.title', body: 'supplierCatalog.error.body' },
  noSupplier: { title: 'supplierCatalog.noSupplier.title', body: 'supplierCatalog.noSupplier.body' },
  empty: { title: 'supplierCatalog.empty.title', body: 'supplierCatalog.empty.body', action: 'supplierCatalog.empty.action' },
  noResults: { title: 'supplierCatalog.noResults.title', body: 'supplierCatalog.noResults.body', action: 'supplierCatalog.noResults.action' },

  addItem: 'supplierCatalog.addItem',
  bulkUpload: 'supplierCatalog.bulkUpload',
  searchPlaceholder: 'supplierCatalog.searchPlaceholder',
  filters: {
    supplierAll: 'supplierCatalog.filters.supplierAll',
    categoryAll: 'supplierCatalog.filters.categoryAll',
    driveTypeAll: 'supplierCatalog.filters.driveTypeAll',
  },
  view: {
    active: 'supplierCatalog.view.active',
    review: 'supplierCatalog.view.review',
    discontinued: 'supplierCatalog.view.discontinued',
  },
  showMore: 'supplierCatalog.showMore',
  countShown: 'supplierCatalog.countShown',

  row: {
    leadTime: 'supplierCatalog.row.leadTime',
    anyDrive: 'supplierCatalog.row.anyDrive',
    lowest: 'supplierCatalog.row.lowest',
    aboveLowest: 'supplierCatalog.row.aboveLowest',
    pendingPrice: 'supplierCatalog.row.pendingPrice',
    itemPending: 'supplierCatalog.row.itemPending',
    discontinued: 'supplierCatalog.row.discontinued',
    rejected: 'supplierCatalog.row.rejected',
  },

  review: {
    heading: 'supplierCatalog.review.heading',
    headingSupplier: 'supplierCatalog.review.headingSupplier',
    none: 'supplierCatalog.review.none',
    newListing: 'supplierCatalog.review.newListing',
    change: 'supplierCatalog.review.change',
    requested: 'supplierCatalog.review.requested',
    lowestInCategory: 'supplierCatalog.review.lowestInCategory',
    approve: 'supplierCatalog.review.approve',
    reject: 'supplierCatalog.review.reject',
    rejectReason: 'supplierCatalog.review.rejectReason',
    confirmReject: 'supplierCatalog.review.confirmReject',
    cancel: 'supplierCatalog.review.cancel',
    waitingNote: 'supplierCatalog.review.waitingNote',
  },

  detail: {
    newTitle: 'supplierCatalog.detail.newTitle',
    editTitle: 'supplierCatalog.detail.editTitle',
    supplier: 'supplierCatalog.detail.supplier',
    supplierPick: 'supplierCatalog.detail.supplierPick',
    category: 'supplierCatalog.detail.category',
    categoryOther: 'supplierCatalog.detail.categoryOther',
    categoryOtherHint: 'supplierCatalog.detail.categoryOtherHint',
    categoryFixed: 'supplierCatalog.detail.categoryFixed',
    description: 'supplierCatalog.detail.description',
    specification: 'supplierCatalog.detail.specification',
    specificationHint: 'supplierCatalog.detail.specificationHint',
    driveTypes: 'supplierCatalog.detail.driveTypes',
    driveTypesHint: 'supplierCatalog.detail.driveTypesHint',
    price: 'supplierCatalog.detail.price',
    leadTime: 'supplierCatalog.detail.leadTime',
    willNeedReview: 'supplierCatalog.detail.willNeedReview',
    adminLive: 'supplierCatalog.detail.adminLive',
    pendingNow: 'supplierCatalog.detail.pendingNow',
    inFlight: 'supplierCatalog.detail.inFlight',
    save: 'supplierCatalog.detail.save',
    discontinue: 'supplierCatalog.detail.discontinue',
    discontinueNote: 'supplierCatalog.detail.discontinueNote',
    reactivate: 'supplierCatalog.detail.reactivate',
    readOnly: 'supplierCatalog.detail.readOnly',
    history: 'supplierCatalog.detail.history',
    historyEmpty: 'supplierCatalog.detail.historyEmpty',
    historyLoading: 'supplierCatalog.detail.historyLoading',
    firstListing: 'supplierCatalog.detail.firstListing',
    by: 'supplierCatalog.detail.by',
    reviewedBy: 'supplierCatalog.detail.reviewedBy',
    source: {
      supplier: 'supplierCatalog.detail.source.supplier',
      admin: 'supplierCatalog.detail.source.admin',
      bulk_upload: 'supplierCatalog.detail.source.bulk_upload',
    },
    changeStatus: {
      applied: 'supplierCatalog.detail.changeStatus.applied',
      pending: 'supplierCatalog.detail.changeStatus.pending',
      rejected: 'supplierCatalog.detail.changeStatus.rejected',
      superseded: 'supplierCatalog.detail.changeStatus.superseded',
    },
  },

  bulk: {
    title: 'supplierCatalog.bulk.title',
    intro: 'supplierCatalog.bulk.intro',
    formatLabel: 'supplierCatalog.bulk.formatLabel',
    formatHint: 'supplierCatalog.bulk.formatHint',
    supplier: 'supplierCatalog.bulk.supplier',
    pasteLabel: 'supplierCatalog.bulk.pasteLabel',
    chooseFile: 'supplierCatalog.bulk.chooseFile',
    check: 'supplierCatalog.bulk.check',
    apply: 'supplierCatalog.bulk.apply',
    summary: 'supplierCatalog.bulk.summary',
    nothingToApply: 'supplierCatalog.bulk.nothingToApply',
    noRows: 'supplierCatalog.bulk.noRows',
    rowLabel: 'supplierCatalog.bulk.rowLabel',
    action: {
      create: 'supplierCatalog.bulk.action.create',
      update: 'supplierCatalog.bulk.action.update',
      unchanged: 'supplierCatalog.bulk.action.unchanged',
    },
    verdict: {
      ok: 'supplierCatalog.bulk.verdict.ok',
      review: 'supplierCatalog.bulk.verdict.review',
      invalid: 'supplierCatalog.bulk.verdict.invalid',
    },
  },

  settings: {
    heading: 'supplierCatalog.settings.heading',
    body: 'supplierCatalog.settings.body',
    label: 'supplierCatalog.settings.label',
    save: 'supplierCatalog.settings.save',
    invalid: 'supplierCatalog.settings.invalid',
  },

  spread: {
    heading: 'supplierCatalog.spread.heading',
    body: 'supplierCatalog.spread.body',
    range: 'supplierCatalog.spread.range',
    single: 'supplierCatalog.spread.single',
    listings: 'supplierCatalog.spread.listings',
    openPricing: 'supplierCatalog.spread.openPricing',
  },

  toast: {
    saved: 'supplierCatalog.toast.saved',
    pricePending: 'supplierCatalog.toast.pricePending',
    itemPending: 'supplierCatalog.toast.itemPending',
    discontinued: 'supplierCatalog.toast.discontinued',
    reactivated: 'supplierCatalog.toast.reactivated',
    approved: 'supplierCatalog.toast.approved',
    rejected: 'supplierCatalog.toast.rejected',
    bulkApplied: 'supplierCatalog.toast.bulkApplied',
    settingsSaved: 'supplierCatalog.toast.settingsSaved',
    error: 'supplierCatalog.toast.error',
  },

  issue: {
    category_required: 'catalog.issue.category_required',
    description_required: 'catalog.issue.description_required',
    price_not_positive: 'catalog.issue.price_not_positive',
    price_not_number: 'catalog.issue.price_not_number',
    lead_time_invalid: 'catalog.issue.lead_time_invalid',
    unknown_drive_type: 'catalog.issue.unknown_drive_type',
    duplicate_in_upload: 'catalog.issue.duplicate_in_upload',
    item_discontinued: 'catalog.issue.item_discontinued',
    price_outlier_low: 'catalog.issue.price_outlier_low',
    price_outlier_high: 'catalog.issue.price_outlier_high',
    price_implausible: 'catalog.issue.price_implausible',
    over_threshold: 'catalog.issue.over_threshold',
  },
} as const;
