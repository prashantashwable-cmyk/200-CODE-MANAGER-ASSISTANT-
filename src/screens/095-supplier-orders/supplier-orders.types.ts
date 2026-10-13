/** Screen 095 — Supplier Order Status Tracking. Types and translation keys only. */

export type SupplierOrdersStatus = 'loading' | 'ready' | 'error';

/** Past this width the board shows every stage as a column; below it, one
 *  stage at a time with a tab strip (the layout pattern's own rule). */
export const MULTI_COLUMN_MIN_WIDTH = 1024;

export const SUPPLIER_ORDERS_KEYS = {
  title: 'supplierOrders.title',
  deliveries: 'supplierOrders.deliveries',
  shipments: 'supplierOrders.shipments',
  subtitleAdmin: 'supplierOrders.subtitleAdmin',
  subtitleSupplier: 'supplierOrders.subtitleSupplier',
  loading: 'supplierOrders.loading',
  error: { title: 'supplierOrders.error.title', body: 'supplierOrders.error.body' },
  empty: { title: 'supplierOrders.empty.title', bodyAdmin: 'supplierOrders.empty.bodyAdmin', bodySupplier: 'supplierOrders.empty.bodySupplier' },
  columnEmpty: 'supplierOrders.columnEmpty',

  filters: { supplierAll: 'supplierOrders.filters.supplierAll', atRiskOnly: 'supplierOrders.filters.atRiskOnly' },
  stagePosition: 'supplierOrders.stagePosition',
  previous: 'supplierOrders.previous',
  next: 'supplierOrders.next',
  columnMeta: 'supplierOrders.columnMeta',
  dragHandle: 'supplierOrders.dragHandle',
  dropHere: 'supplierOrders.dropHere',

  stage: {
    sent: 'fulfilmentStage.sent',
    acknowledged: 'fulfilmentStage.acknowledged',
    in_production: 'fulfilmentStage.in_production',
    ready_to_ship: 'fulfilmentStage.ready_to_ship',
    shipped: 'fulfilmentStage.shipped',
    delivered: 'fulfilmentStage.delivered',
  },

  card: {
    inStage: 'supplierOrders.card.inStage',
    typical: 'supplierOrders.card.typical',
    typicalDefault: 'supplierOrders.card.typicalDefault',
    expected: 'supplierOrders.card.expected',
    projected: 'supplierOrders.card.projected',
    noExpected: 'supplierOrders.card.noExpected',
    partial: 'supplierOrders.card.partial',
    noLogin: 'supplierOrders.card.noLogin',
    risk: {
      on_track: 'supplierOrders.card.risk.on_track',
      at_risk: 'supplierOrders.card.risk.at_risk',
      overdue: 'supplierOrders.card.risk.overdue',
    },
  },

  sheet: {
    title: 'supplierOrders.sheet.title',
    lines: 'supplierOrders.sheet.lines',
    moveAll: 'supplierOrders.sheet.moveAll',
    keep: 'supplierOrders.sheet.keep',
    note: 'supplierOrders.sheet.note',
    noteHintBackward: 'supplierOrders.sheet.noteHintBackward',
    noteHintOnBehalf: 'supplierOrders.sheet.noteHintOnBehalf',
    noteRequired: 'supplierOrders.sheet.noteRequired',
    backwardWarning: 'supplierOrders.sheet.backwardWarning',
    onBehalfWarning: 'supplierOrders.sheet.onBehalfWarning',
    deliveredIsAiec: 'supplierOrders.sheet.deliveredIsAiec',
    save: 'supplierOrders.sheet.save',
    nothingToSave: 'supplierOrders.sheet.nothingToSave',
    history: 'supplierOrders.sheet.history',
    historyEmpty: 'supplierOrders.sheet.historyEmpty',
    event: 'supplierOrders.sheet.event',
    eventOnBehalf: 'supplierOrders.sheet.eventOnBehalf',
    logisticsPending: 'supplierOrders.sheet.logisticsPending',
    openPo: 'supplierOrders.sheet.openPo',
    messages: 'supplierOrders.sheet.messages',
    delivery: 'supplierOrders.sheet.delivery',
  },

  toast: {
    updated: 'supplierOrders.toast.updated',
    error: 'supplierOrders.toast.error',
  },
} as const;
