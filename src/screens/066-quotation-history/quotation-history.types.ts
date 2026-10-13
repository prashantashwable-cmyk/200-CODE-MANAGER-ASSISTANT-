/** Screen 066 — Quotation Version History. Types and translation keys only. */

export type QuotationHistoryStatus = 'loading' | 'ready' | 'error';

/** A lineage collapses its own version rows past this count, showing only
 *  the newest few plus an "show all" toggle — per the edge case that a
 *  protracted negotiation shouldn't become an unwieldy scroll. */
export const COLLAPSE_AFTER_VERSIONS = 4;

export const QUOTATION_HISTORY_KEYS = {
  title: 'quotationHistory.title',
  subtitle: 'quotationHistory.subtitle',
  loading: 'quotationHistory.loading',
  error: { title: 'quotationHistory.error.title', body: 'quotationHistory.error.body' },
  empty: { title: 'quotationHistory.empty.title', body: 'quotationHistory.empty.body' },

  lineageRow: {
    versions: 'quotationHistory.lineageRow.versions',
  },

  versionCard: {
    current: 'quotationHistory.versionCard.current',
    createdBy: 'quotationHistory.versionCard.createdBy',
    noChanges: 'quotationHistory.versionCard.noChanges',
    restore: 'quotationHistory.versionCard.restore',
    delivery: 'quotationHistory.versionCard.delivery',
    notSent: 'quotationHistory.versionCard.notSent',
  },

  diff: {
    driveType: 'quotationHistory.diff.driveType',
    finishTier: 'quotationHistory.diff.finishTier',
    capacityPersons: 'quotationHistory.diff.capacityPersons',
    stopsCount: 'quotationHistory.diff.stopsCount',
    finalPrice: 'quotationHistory.diff.finalPrice',
    validityDate: 'quotationHistory.diff.validityDate',
  },

  showAll: 'quotationHistory.showAll',

  toast: {
    restored: 'quotationHistory.toast.restored',
    error: 'quotationHistory.toast.error',
  },
} as const;
