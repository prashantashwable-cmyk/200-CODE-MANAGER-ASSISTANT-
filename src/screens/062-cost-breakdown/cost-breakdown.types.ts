/** Screen 062 — Cost Breakdown & Profit Margin Calculator. Types and translation keys only. */

export type CostBreakdownStatus = 'loading' | 'ready' | 'error';

/** Margin within this many points of the floor gets an explicit warning
 *  even though it's still technically allowed. */
export const MARGIN_WARNING_BUFFER_PCT = 2;

export const COST_BREAKDOWN_KEYS = {
  title: 'costBreakdown.title',
  loading: 'costBreakdown.loading',
  error: { title: 'costBreakdown.error.title', body: 'costBreakdown.error.body' },

  finalPriceLabel: 'costBreakdown.finalPriceLabel',
  gstInclusiveNote: 'costBreakdown.gstInclusiveNote',

  lineItems: {
    heading: 'costBreakdown.lineItems.heading',
    equipment: 'costBreakdown.lineItems.equipment',
    civilWork: 'costBreakdown.lineItems.civilWork',
    civilWorkAdjusted: 'costBreakdown.lineItems.civilWorkAdjusted',
    labor: 'costBreakdown.lineItems.labor',
    transport: 'costBreakdown.lineItems.transport',
    subtotal: 'costBreakdown.lineItems.subtotal',
    margin: 'costBreakdown.lineItems.margin',
    gst: 'costBreakdown.lineItems.gst',
    total: 'costBreakdown.lineItems.total',
    adjust: 'costBreakdown.lineItems.adjust',
  },

  perFloorDelta: 'costBreakdown.perFloorDelta',

  marginSection: {
    heading: 'costBreakdown.marginSection.heading',
    subtitle: 'costBreakdown.marginSection.subtitle',
    currentLabel: 'costBreakdown.marginSection.currentLabel',
    floorLabel: 'costBreakdown.marginSection.floorLabel',
    warningNearFloor: 'costBreakdown.marginSection.warningNearFloor',
    blockedBelowFloor: 'costBreakdown.marginSection.blockedBelowFloor',
    save: 'costBreakdown.marginSection.save',
  },

  civilWorkSheet: {
    title: 'costBreakdown.civilWorkSheet.title',
    body: 'costBreakdown.civilWorkSheet.body',
    amountLabel: 'costBreakdown.civilWorkSheet.amountLabel',
    noteLabel: 'costBreakdown.civilWorkSheet.noteLabel',
    noteRequired: 'costBreakdown.civilWorkSheet.noteRequired',
    save: 'costBreakdown.civilWorkSheet.save',
  },

  continue: 'costBreakdown.continue',

  toast: {
    saved: 'costBreakdown.toast.saved',
    blocked: 'costBreakdown.toast.blocked',
    error: 'costBreakdown.toast.error',
  },
} as const;
