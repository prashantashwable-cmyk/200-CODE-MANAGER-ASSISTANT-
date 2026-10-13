/** Screen 102 — Live Shipment Tracking. Types and translation keys only. */

import type { ShipmentMilestone, ShipmentTrackingSource } from '@/data/types';

export type ShipmentTrackingStatus = 'loading' | 'ready' | 'error';

/** How often the board is re-read while the screen is open. */
export const POLL_MS = 15_000;

export const TRACKING_SOURCES: ShipmentTrackingSource[] = ['live_gps', 'manual'];

/** Every milestone Admin or a supplier may report by hand, in order. */
export const MANUAL_MILESTONES: ShipmentMilestone[] = ['in_transit', 'nearby', 'arrived'];

export const SHIPMENT_TRACKING_KEYS = {
  title: 'shipmentTracking.title',
  subtitleAdmin: 'shipmentTracking.subtitleAdmin',
  subtitleSupplier: 'shipmentTracking.subtitleSupplier',
  subtitleCustomer: 'shipmentTracking.subtitleCustomer',
  subtitleTechnician: 'shipmentTracking.subtitleTechnician',
  loading: 'shipmentTracking.loading',
  error: { title: 'shipmentTracking.error.title', body: 'shipmentTracking.error.body' },
  empty: {
    title: 'shipmentTracking.empty.title',
    bodyAdmin: 'shipmentTracking.empty.bodyAdmin',
    bodyCustomer: 'shipmentTracking.empty.bodyCustomer',
  },
  alert: { feedLost: 'shipmentTracking.alert.feedLost' },
  milestone: {
    dispatched: 'shipmentTracking.milestone.dispatched',
    in_transit: 'shipmentTracking.milestone.in_transit',
    nearby: 'shipmentTracking.milestone.nearby',
    arrived: 'shipmentTracking.milestone.arrived',
  },
  milestoneMeta: {
    gps: 'shipmentTracking.milestoneMeta.gps',
    manual: 'shipmentTracking.milestoneMeta.manual',
    manualBy: 'shipmentTracking.milestoneMeta.manualBy',
    notNotified: 'shipmentTracking.milestoneMeta.notNotified',
    notified: 'shipmentTracking.milestoneMeta.notified',
  },
  list: {
    heading: 'shipmentTracking.list.heading',
    legOf: 'shipmentTracking.list.legOf',
    arrivedBadge: 'shipmentTracking.list.arrivedBadge',
  },
  feed: {
    live: 'shipmentTracking.feed.live',
    lost: 'shipmentTracking.feed.lost',
    manual: 'shipmentTracking.feed.manual',
  },
  map: {
    label: 'shipmentTracking.map.label',
    vehicle: 'shipmentTracking.map.vehicle',
    lastKnown: 'shipmentTracking.map.lastKnown',
    origin: 'shipmentTracking.map.origin',
    site: 'shipmentTracking.map.site',
    legendTravelled: 'shipmentTracking.map.legendTravelled',
    legendPlanned: 'shipmentTracking.map.legendPlanned',
  },
  hero: {
    etaIn: 'shipmentTracking.hero.etaIn',
    etaLate: 'shipmentTracking.hero.etaLate',
    etaAt: 'shipmentTracking.hero.etaAt',
    hoursMinutes: 'shipmentTracking.hero.hoursMinutes',
    minutesOnly: 'shipmentTracking.hero.minutesOnly',
    remainingKm: 'shipmentTracking.hero.remainingKm',
    arrivedAt: 'shipmentTracking.hero.arrivedAt',
    lastKnown: 'shipmentTracking.hero.lastKnown',
    lostBody: 'shipmentTracking.hero.lostBody',
    manualBody: 'shipmentTracking.hero.manualBody',
    manualLast: 'shipmentTracking.hero.manualLast',
  },
  customer: {
    onTheWay: 'shipmentTracking.customer.onTheWay',
    nearby: 'shipmentTracking.customer.nearby',
    arrived: 'shipmentTracking.customer.arrived',
    dispatched: 'shipmentTracking.customer.dispatched',
    around: 'shipmentTracking.customer.around',
    manualHint: 'shipmentTracking.customer.manualHint',
    viewConfirmation: 'shipmentTracking.customer.viewConfirmation',
  },
  window: {
    heading: 'shipmentTracking.window.heading',
    outside: 'shipmentTracking.window.outside',
    morning: 'shipmentTracking.window.morning',
    afternoon: 'shipmentTracking.window.afternoon',
    inside: 'shipmentTracking.window.inside',
  },
  detail: {
    supplier: 'shipmentTracking.detail.supplier',
    carrier: 'shipmentTracking.detail.carrier',
    vehicle: 'shipmentTracking.detail.vehicle',
    driver: 'shipmentTracking.detail.driver',
    callDriver: 'shipmentTracking.detail.callDriver',
    from: 'shipmentTracking.detail.from',
    to: 'shipmentTracking.detail.to',
    dispatched: 'shipmentTracking.detail.dispatched',
    linesHeading: 'shipmentTracking.detail.linesHeading',
    timelineHeading: 'shipmentTracking.detail.timelineHeading',
    openPo: 'shipmentTracking.detail.openPo',
    openDelivery: 'shipmentTracking.detail.openDelivery',
    checkDelivery: 'shipmentTracking.detail.checkDelivery',
  },
  update: {
    open: 'shipmentTracking.update.open',
    title: 'shipmentTracking.update.title',
    intro: 'shipmentTracking.update.intro',
    introAdmin: 'shipmentTracking.update.introAdmin',
    milestone: 'shipmentTracking.update.milestone',
    note: 'shipmentTracking.update.note',
    noteHint: 'shipmentTracking.update.noteHint',
    noteHintAdmin: 'shipmentTracking.update.noteHintAdmin',
    eta: 'shipmentTracking.update.eta',
    etaHint: 'shipmentTracking.update.etaHint',
    submit: 'shipmentTracking.update.submit',
    lostNote: 'shipmentTracking.update.lostNote',
    none: 'shipmentTracking.update.none',
    noneBody: 'shipmentTracking.update.noneBody',
  },
  dispatch: {
    open: 'shipmentTracking.dispatch.open',
    bookCarrier: 'shipmentTracking.dispatch.bookCarrier',
    title: 'shipmentTracking.dispatch.title',
    intro: 'shipmentTracking.dispatch.intro',
    po: 'shipmentTracking.dispatch.po',
    lines: 'shipmentTracking.dispatch.lines',
    vehicle: 'shipmentTracking.dispatch.vehicle',
    vehicleHint: 'shipmentTracking.dispatch.vehicleHint',
    driver: 'shipmentTracking.dispatch.driver',
    phone: 'shipmentTracking.dispatch.phone',
    source: 'shipmentTracking.dispatch.source',
    sourceLive: 'shipmentTracking.dispatch.sourceLive',
    sourceManual: 'shipmentTracking.dispatch.sourceManual',
    sourceLiveHint: 'shipmentTracking.dispatch.sourceLiveHint',
    sourceManualHint: 'shipmentTracking.dispatch.sourceManualHint',
    submit: 'shipmentTracking.dispatch.submit',
    nothing: 'shipmentTracking.dispatch.nothing',
    nothingBody: 'shipmentTracking.dispatch.nothingBody',
  },
  toast: {
    dispatched: 'shipmentTracking.toast.dispatched',
    updated: 'shipmentTracking.toast.updated',
  },
  /** One line per repository error, so the message says exactly what to fix. */
  problem: {
    forbidden: 'shipmentTracking.problem.forbidden',
    not_found: 'shipmentTracking.problem.not_found',
    no_destination: 'shipmentTracking.problem.no_destination',
    invalid_input: 'shipmentTracking.problem.invalid_input',
    invalid_state: 'shipmentTracking.problem.invalid_state',
    reason_required: 'shipmentTracking.problem.reason_required',
    generic: 'shipmentTracking.problem.generic',
  },
} as const;
