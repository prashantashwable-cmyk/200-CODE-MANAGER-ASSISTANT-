/** Screen 185 — SLA Monitor. Types and keys only. */
export const POLL_MS = 30_000;
export const PULL_DISTANCE = 70;
export const ALERTS_ROUTE = '/admin/alerts';

export const SLA_MONITOR_KEYS = {
  title: 'slaMonitor.title',
  subtitle: 'slaMonitor.subtitle',
  loading: 'slaMonitor.loading',
  offline: 'slaMonitor.offline',
  refresh: {
    button: 'slaMonitor.refresh.button',
    pull: 'slaMonitor.refresh.pull',
    release: 'slaMonitor.refresh.release',
    busy: 'slaMonitor.refresh.busy',
  },
  error: {
    title: 'slaMonitor.error.title',
    body: 'slaMonitor.error.body',
    retry: 'slaMonitor.error.retry',
  },
  kpi: {
    breached: 'slaMonitor.kpi.breached',
    atRisk: 'slaMonitor.kpi.atRisk',
    processes: 'slaMonitor.kpi.processes',
    compliance: 'slaMonitor.kpi.compliance',
    complianceValue: 'slaMonitor.kpi.complianceValue',
    notEnough: 'slaMonitor.kpi.notEnough',
    window: 'slaMonitor.kpi.window',
  },
  triage: {
    title: 'slaMonitor.triage.title',
    hint: 'slaMonitor.triage.hint',
    none: 'slaMonitor.triage.none',
    noneBody: 'slaMonitor.triage.noneBody',
    why: 'slaMonitor.triage.why',
    open: 'slaMonitor.triage.open',
  },
  cat: {
    title: 'slaMonitor.cat.title',
    reply: {
      name: 'slaMonitor.cat.reply.name',
      what: 'slaMonitor.cat.reply.what',
    },
    service_ticket: {
      name: 'slaMonitor.cat.service_ticket.name',
      what: 'slaMonitor.cat.service_ticket.what',
    },
    payment_dispute: {
      name: 'slaMonitor.cat.payment_dispute.name',
      what: 'slaMonitor.cat.payment_dispute.what',
    },
    payout_dispute: {
      name: 'slaMonitor.cat.payout_dispute.name',
      what: 'slaMonitor.cat.payout_dispute.what',
    },
    supplier_dispute: {
      name: 'slaMonitor.cat.supplier_dispute.name',
      what: 'slaMonitor.cat.supplier_dispute.what',
    },
    delivery_delay: {
      name: 'slaMonitor.cat.delivery_delay.name',
      what: 'slaMonitor.cat.delivery_delay.what',
    },
  },
  status: {
    on_track: 'slaMonitor.status.on_track',
    at_risk: 'slaMonitor.status.at_risk',
    breached: 'slaMonitor.status.breached',
    met: 'slaMonitor.status.met',
    missed: 'slaMonitor.status.missed',
  },
  pause: {
    waiting_on_customer: 'slaMonitor.pause.waiting_on_customer',
    on_hold: 'slaMonitor.pause.on_hold',
    outside_hours: 'slaMonitor.pause.outside_hours',
  },
  dur: {
    min: 'slaMonitor.dur.min',
    h: 'slaMonitor.dur.h',
    d: 'slaMonitor.dur.d',
  },
  card: {
    running: 'slaMonitor.card.running',
    onTrack: 'slaMonitor.card.onTrack',
    atRisk: 'slaMonitor.card.atRisk',
    breached: 'slaMonitor.card.breached',
    target: 'slaMonitor.card.target',
    targetNone: 'slaMonitor.card.targetNone',
    rate: 'slaMonitor.card.rate',
    rateNone: 'slaMonitor.card.rateNone',
    details: 'slaMonitor.card.details',
  },
  trend: {
    improving: 'slaMonitor.trend.improving',
    declining: 'slaMonitor.trend.declining',
    steady: 'slaMonitor.trend.steady',
    too_little: 'slaMonitor.trend.too_little',
  },
  target: {
    fits: 'slaMonitor.target.fits',
    tight: 'slaMonitor.target.tight',
    loose: 'slaMonitor.target.loose',
    too_little: 'slaMonitor.target.too_little',
    median: 'slaMonitor.target.median',
    open: 'slaMonitor.target.open',
  },
  detail: {
    running: 'slaMonitor.detail.running',
    none: 'slaMonitor.detail.none',
    elapsed: 'slaMonitor.detail.elapsed',
    since: 'slaMonitor.detail.since',
    weeks: 'slaMonitor.detail.weeks',
    weekLine: 'slaMonitor.detail.weekLine',
    weekNone: 'slaMonitor.detail.weekNone',
    fair: 'slaMonitor.detail.fair',
    fairBusiness: 'slaMonitor.detail.fairBusiness',
    fairCalendar: 'slaMonitor.detail.fairCalendar',
    alertOwn: 'slaMonitor.detail.alertOwn',
    alertSla: 'slaMonitor.detail.alertSla',
  },
  note: {
    placeholders: 'slaMonitor.note.placeholders',
  },
  close: 'slaMonitor.close',
  alert: {
    breach: 'slaMonitor.alert.breach',
  },
  link: {
    open: 'slaMonitor.link.open',
  },
} as const;
