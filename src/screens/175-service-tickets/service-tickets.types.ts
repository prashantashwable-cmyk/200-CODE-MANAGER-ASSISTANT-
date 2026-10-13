import type { TicketCategory, TicketImpact } from '@/data/types';

export const POLL_MS = 30_000;
export const SERVICE_PATH = '/service-requests';
export const ticketPath = (id: string) => `/service-requests/${id}`;
export const viewKey = (userId: string, what: string) => `aiec.serviceTickets.${userId}.${what}`;
export const draftKey = (userId: string) => `aiec.ticketDraft.${userId}`;
export const outboxKey = (userId: string) => `aiec.ticketOutbox.${userId}`;
/** The categories a customer picks from in the form (an emergency has its own path above it). */
export const FORM_CATEGORIES: TicketCategory[] = ['safety', 'fault', 'billing', 'general'];

export interface TicketDraft { category: TicketCategory | null; liftKey: string; impact: TicketImpact | null; description: string; claim: boolean }
export const EMPTY_DRAFT: TicketDraft = { category: null, liftKey: '', impact: null, description: '', claim: false };

/** A span of time as the number and unit to say it with (`serviceTickets.time.<unit>`). */
export function durationOf(ms: number): { unit: 'minutes' | 'hours' | 'days'; count: number } {
  const m = Math.max(1, Math.round(ms / 60_000));
  if (m < 90) return { unit: 'minutes', count: m };
  const h = Math.round(m / 60);
  if (h < 48) return { unit: 'hours', count: h };
  return { unit: 'days', count: Math.round(h / 24) };
}

export const TICKET_KEYS = {
  title: 'serviceTickets.title',
  subtitle: {
    customer: 'serviceTickets.subtitle.customer',
    admin: 'serviceTickets.subtitle.admin',
    technician: 'serviceTickets.subtitle.technician',
  },
  loading: 'serviceTickets.loading',
  error: {
    title: 'serviceTickets.error.title',
    body: 'serviceTickets.error.body',
  },
  offline: 'serviceTickets.offline',
  refresh: 'serviceTickets.refresh',
  close: 'serviceTickets.close',
  back: 'serviceTickets.back',
  notFound: 'serviceTickets.notFound',
  visits: {
    mine: 'serviceTickets.visits.mine',
    mineBody: 'serviceTickets.visits.mineBody',
  },
  link: {
    open: 'serviceTickets.link.open',
  },
  notice: {
    placeholders: 'serviceTickets.notice.placeholders',
  },
  emergency: {
    title: 'serviceTickets.emergency.title',
    body: 'serviceTickets.emergency.body',
    call: 'serviceTickets.emergency.call',
    alert: 'serviceTickets.emergency.alert',
    note: 'serviceTickets.emergency.note',
    sheet: {
      title: 'serviceTickets.emergency.sheet.title',
      body: 'serviceTickets.emergency.sheet.body',
      lift: 'serviceTickets.emergency.sheet.lift',
      send: 'serviceTickets.emergency.sheet.send',
    },
    sent: {
      title: 'serviceTickets.emergency.sent.title',
      body: 'serviceTickets.emergency.sent.body',
    },
    noLift: 'serviceTickets.emergency.noLift',
    queued: 'serviceTickets.emergency.queued',
    failed: 'serviceTickets.emergency.failed',
  },
  tab: {
    new: 'serviceTickets.tab.new',
    mine: 'serviceTickets.tab.mine',
  },
  mine: {
    empty: {
      title: 'serviceTickets.mine.empty.title',
      body: 'serviceTickets.mine.empty.body',
    },
    new: 'serviceTickets.mine.new',
  },
  row: {
    visit: 'serviceTickets.row.visit',
    newReply: 'serviceTickets.row.newReply',
    replyBy: 'serviceTickets.row.replyBy',
    late: 'serviceTickets.row.late',
  },
  form: {
    section: {
      about: 'serviceTickets.form.section.about',
      where: 'serviceTickets.form.section.where',
      impact: 'serviceTickets.form.section.impact',
      details: 'serviceTickets.form.section.details',
      media: 'serviceTickets.form.section.media',
      claim: 'serviceTickets.form.section.claim',
    },
    lift: {
      label: 'serviceTickets.form.lift.label',
      none: 'serviceTickets.form.lift.none',
      inProgress: 'serviceTickets.form.lift.inProgress',
    },
    description: {
      label: 'serviceTickets.form.description.label',
      hint: 'serviceTickets.form.description.hint',
      count: 'serviceTickets.form.description.count',
      short: 'serviceTickets.form.description.short',
      ok: 'serviceTickets.form.description.ok',
    },
    safetyHint: {
      title: 'serviceTickets.form.safetyHint.title',
      body: 'serviceTickets.form.safetyHint.body',
      treat: 'serviceTickets.form.safetyHint.treat',
    },
    media: {
      add: 'serviceTickets.form.media.add',
      hint: 'serviceTickets.form.media.hint',
      remove: 'serviceTickets.form.media.remove',
      video: 'serviceTickets.form.media.video',
      failed: 'serviceTickets.form.media.failed',
      videoNote: 'serviceTickets.form.media.videoNote',
    },
    claim: {
      label: 'serviceTickets.form.claim.label',
      hint: 'serviceTickets.form.claim.hint',
    },
    submit: 'serviceTickets.form.submit',
    sending: 'serviceTickets.form.sending',
    draftKept: 'serviceTickets.form.draftKept',
    queued: 'serviceTickets.form.queued',
    sent: {
      title: 'serviceTickets.form.sent.title',
      body: 'serviceTickets.form.sent.body',
      open: 'serviceTickets.form.sent.open',
    },
  },
  cat: {
    emergency: {
      title: 'serviceTickets.cat.emergency.title',
    },
    safety: {
      title: 'serviceTickets.cat.safety.title',
      body: 'serviceTickets.cat.safety.body',
    },
    fault: {
      title: 'serviceTickets.cat.fault.title',
      body: 'serviceTickets.cat.fault.body',
    },
    billing: {
      title: 'serviceTickets.cat.billing.title',
      body: 'serviceTickets.cat.billing.body',
    },
    general: {
      title: 'serviceTickets.cat.general.title',
      body: 'serviceTickets.cat.general.body',
    },
    maintenance: {
      title: 'serviceTickets.cat.maintenance.title',
      body: 'serviceTickets.cat.maintenance.body',
    },
  },
  coverage: {
    in_warranty: 'serviceTickets.coverage.in_warranty',
    on_amc: 'serviceTickets.coverage.on_amc',
    out_of_cover: 'serviceTickets.coverage.out_of_cover',
    unknown: 'serviceTickets.coverage.unknown',
  },
  impact: {
    out_of_service: 'serviceTickets.impact.out_of_service',
    working_badly: 'serviceTickets.impact.working_badly',
    minor: 'serviceTickets.impact.minor',
  },
  estimate: {
    title: 'serviceTickets.estimate.title',
    reply: 'serviceTickets.estimate.reply',
    amc: 'serviceTickets.estimate.amc',
    route: {
      site_visit: 'serviceTickets.estimate.route.site_visit',
      accounts: 'serviceTickets.estimate.route.accounts',
      triage: 'serviceTickets.estimate.route.triage',
    },
    human: 'serviceTickets.estimate.human',
  },
  time: {
    minutes: 'serviceTickets.time.minutes',
    hours: 'serviceTickets.time.hours',
    days: 'serviceTickets.time.days',
  },
  problem: {
    category_required: 'serviceTickets.problem.category_required',
    lift_required: 'serviceTickets.problem.lift_required',
    description_short: 'serviceTickets.problem.description_short',
    description_long: 'serviceTickets.problem.description_long',
    too_many_attachments: 'serviceTickets.problem.too_many_attachments',
    impact_required: 'serviceTickets.problem.impact_required',
    not_handed_over: 'serviceTickets.problem.not_handed_over',
    note_short: 'serviceTickets.problem.note_short',
    invalid_state: 'serviceTickets.problem.invalid_state',
    window_closed: 'serviceTickets.problem.window_closed',
    training_incomplete: 'serviceTickets.problem.training_incomplete',
    date_past: 'serviceTickets.problem.date_past',
    window_passed: 'serviceTickets.problem.window_passed',
    too_far: 'serviceTickets.problem.too_far',
    date_invalid: 'serviceTickets.problem.date_invalid',
    outcome_required: 'serviceTickets.problem.outcome_required',
    notes_short: 'serviceTickets.problem.notes_short',
    parts_note_required: 'serviceTickets.problem.parts_note_required',
    responsibility_required: 'serviceTickets.problem.responsibility_required',
    evidence_unreviewed: 'serviceTickets.problem.evidence_unreviewed',
    generic: 'serviceTickets.problem.generic',
  },
  status: {
    submitted: 'serviceTickets.status.submitted',
    assigned: 'serviceTickets.status.assigned',
    in_progress: 'serviceTickets.status.in_progress',
    resolved: 'serviceTickets.status.resolved',
    withdrawn: 'serviceTickets.status.withdrawn',
  },
  urgency: {
    emergency: 'serviceTickets.urgency.emergency',
    high: 'serviceTickets.urgency.high',
    normal: 'serviceTickets.urgency.normal',
    low: 'serviceTickets.urgency.low',
  },
  route: {
    emergency: 'serviceTickets.route.emergency',
    site_visit: 'serviceTickets.route.site_visit',
    accounts: 'serviceTickets.route.accounts',
    triage: 'serviceTickets.route.triage',
  },
  detail: {
    reply: {
      by: 'serviceTickets.detail.reply.by',
      late: 'serviceTickets.detail.reply.late',
      done: 'serviceTickets.detail.reply.done',
    },
    emergency: 'serviceTickets.detail.emergency',
    visit: {
      title: 'serviceTickets.detail.visit.title',
      body: 'serviceTickets.detail.visit.body',
      window: {
        morning: 'serviceTickets.detail.visit.window.morning',
        afternoon: 'serviceTickets.detail.visit.window.afternoon',
      },
      started: 'serviceTickets.detail.visit.started',
      done: 'serviceTickets.detail.visit.done',
      missed: 'serviceTickets.detail.visit.missed',
    },
    coverage: {
      title: 'serviceTickets.detail.coverage.title',
    },
    claim: {
      title: 'serviceTickets.detail.claim.title',
      pending: 'serviceTickets.detail.claim.pending',
      covered: 'serviceTickets.detail.claim.covered',
      chargeable: 'serviceTickets.detail.claim.chargeable',
    },
    updates: 'serviceTickets.detail.updates',
    attachments: 'serviceTickets.detail.attachments',
    info: {
      title: 'serviceTickets.detail.info.title',
      placeholder: 'serviceTickets.detail.info.placeholder',
      send: 'serviceTickets.detail.info.send',
    },
    withdraw: {
      open: 'serviceTickets.detail.withdraw.open',
      title: 'serviceTickets.detail.withdraw.title',
      body: 'serviceTickets.detail.withdraw.body',
      reason: 'serviceTickets.detail.withdraw.reason',
      confirm: 'serviceTickets.detail.withdraw.confirm',
      keep: 'serviceTickets.detail.withdraw.keep',
    },
    reopen: {
      open: 'serviceTickets.detail.reopen.open',
      title: 'serviceTickets.detail.reopen.title',
      body: 'serviceTickets.detail.reopen.body',
      confirm: 'serviceTickets.detail.reopen.confirm',
    },
    call: 'serviceTickets.detail.call',
  },
  resp: {
    aiec_installation: 'serviceTickets.resp.aiec_installation',
    manufacturer_defect: 'serviceTickets.resp.manufacturer_defect',
    customer_misuse: 'serviceTickets.resp.customer_misuse',
    normal_wear: 'serviceTickets.resp.normal_wear',
  },
  event: {
    filed: 'serviceTickets.event.filed',
    reply: 'serviceTickets.event.reply',
    info: 'serviceTickets.event.info',
    assigned: 'serviceTickets.event.assigned',
    reassigned: 'serviceTickets.event.reassigned',
    started: 'serviceTickets.event.started',
    visit_done: 'serviceTickets.event.visit_done',
    resolved: 'serviceTickets.event.resolved',
    reopened: 'serviceTickets.event.reopened',
    withdrawn: 'serviceTickets.event.withdrawn',
    claim_decided: 'serviceTickets.event.claim_decided',
    internal_note: 'serviceTickets.event.internal_note',
    triaged: 'serviceTickets.event.triaged',
    retriaged: 'serviceTickets.event.retriaged',
    urgency_changed: 'serviceTickets.event.urgency_changed',
    on_the_way: 'serviceTickets.event.on_the_way',
  },
  outcome: {
    fixed: 'serviceTickets.outcome.fixed',
    needs_parts: 'serviceTickets.outcome.needs_parts',
    needs_followup: 'serviceTickets.outcome.needs_followup',
    no_fault_found: 'serviceTickets.outcome.no_fault_found',
    unsafe_shut_down: 'serviceTickets.outcome.unsafe_shut_down',
  },
  board: {
    filter: {
      open: 'serviceTickets.board.filter.open',
      triage: 'serviceTickets.board.filter.triage',
      safety: 'serviceTickets.board.filter.safety',
      claims: 'serviceTickets.board.filter.claims',
      late: 'serviceTickets.board.filter.late',
      resolved: 'serviceTickets.board.filter.resolved',
      all: 'serviceTickets.board.filter.all',
    },
    search: 'serviceTickets.board.search',
    empty: {
      title: 'serviceTickets.board.empty.title',
      body: 'serviceTickets.board.empty.body',
    },
  },
  adm: {
    triage: {
      title: 'serviceTickets.adm.triage.title',
      confident: 'serviceTickets.adm.triage.confident',
      human: 'serviceTickets.adm.triage.human',
      confirmed: 'serviceTickets.adm.triage.confirmed',
      change: 'serviceTickets.adm.triage.change',
      category: 'serviceTickets.adm.triage.category',
      urgency: 'serviceTickets.adm.triage.urgency',
      note: 'serviceTickets.adm.triage.note',
      save: 'serviceTickets.adm.triage.save',
      hint: 'serviceTickets.adm.triage.hint',
    },
    customer: 'serviceTickets.adm.customer',
    call: 'serviceTickets.adm.call',
    navigate: 'serviceTickets.adm.navigate',
    evidence: {
      title: 'serviceTickets.adm.evidence.title',
      body: 'serviceTickets.adm.evidence.body',
    },
    claim: {
      title: 'serviceTickets.adm.claim.title',
      body: 'serviceTickets.adm.claim.body',
      reviewed: 'serviceTickets.adm.claim.reviewed',
      responsibility: 'serviceTickets.adm.claim.responsibility',
      note: 'serviceTickets.adm.claim.note',
      save: 'serviceTickets.adm.claim.save',
      decided: 'serviceTickets.adm.claim.decided',
      decidedBy: 'serviceTickets.adm.claim.decidedBy',
    },
    visit: {
      title: 'serviceTickets.adm.visit.title',
      tech: 'serviceTickets.adm.visit.tech',
      date: 'serviceTickets.adm.visit.date',
      window: 'serviceTickets.adm.visit.window',
      load: 'serviceTickets.adm.visit.load',
      notEligible: 'serviceTickets.adm.visit.notEligible',
      note: 'serviceTickets.adm.visit.note',
      book: 'serviceTickets.adm.visit.book',
      rebook: 'serviceTickets.adm.visit.rebook',
      current: 'serviceTickets.adm.visit.current',
    },
    actions: {
      start: 'serviceTickets.adm.actions.start',
      resolve: 'serviceTickets.adm.actions.resolve',
    },
    resolve: {
      note: 'serviceTickets.adm.resolve.note',
      confirm: 'serviceTickets.adm.resolve.confirm',
    },
    reply: {
      title: 'serviceTickets.adm.reply.title',
      placeholder: 'serviceTickets.adm.reply.placeholder',
      send: 'serviceTickets.adm.reply.send',
    },
    internal: {
      title: 'serviceTickets.adm.internal.title',
      send: 'serviceTickets.adm.internal.send',
    },
    timeline: 'serviceTickets.adm.timeline',
    internalTag: 'serviceTickets.adm.internalTag',
    reopen: 'serviceTickets.adm.reopen',
    noLift: 'serviceTickets.adm.noLift',
  },
  reason: {
    vague: 'serviceTickets.reason.vague',
    safety_words: 'serviceTickets.reason.safety_words',
    general: 'serviceTickets.reason.general',
    claim: 'serviceTickets.reason.claim',
  },
  ev: {
    installation: 'serviceTickets.ev.installation',
    materials: 'serviceTickets.ev.materials',
    issues: 'serviceTickets.ev.issues',
    snags: 'serviceTickets.ev.snags',
    qc_mechanical: 'serviceTickets.ev.qc_mechanical',
    qc_electrical: 'serviceTickets.ev.qc_electrical',
    safety: 'serviceTickets.ev.safety',
    compliance: 'serviceTickets.ev.compliance',
    handover: 'serviceTickets.ev.handover',
    warranty: 'serviceTickets.ev.warranty',
    flag: 'serviceTickets.ev.flag',
    open: 'serviceTickets.ev.open',
    none: 'serviceTickets.ev.none',
  },
  window: {
    morning: 'serviceTickets.window.morning',
    afternoon: 'serviceTickets.window.afternoon',
  },
  tech: {
    empty: {
      title: 'serviceTickets.tech.empty.title',
      body: 'serviceTickets.tech.empty.body',
    },
    section: {
      today: 'serviceTickets.tech.section.today',
      upcoming: 'serviceTickets.tech.section.upcoming',
      done: 'serviceTickets.tech.section.done',
    },
    row: {
      when: 'serviceTickets.tech.row.when',
    },
    safety: 'serviceTickets.tech.safety',
    customer: 'serviceTickets.tech.customer',
    said: 'serviceTickets.tech.said',
    start: 'serviceTickets.tech.start',
    complete: 'serviceTickets.tech.complete',
    form: {
      outcome: 'serviceTickets.tech.form.outcome',
      notes: 'serviceTickets.tech.form.notes',
      parts: 'serviceTickets.tech.form.parts',
      save: 'serviceTickets.tech.form.save',
    },
    unsafe: 'serviceTickets.tech.unsafe',
    done: 'serviceTickets.tech.done',
    noAccess: 'serviceTickets.tech.noAccess',
    onTheWay: 'serviceTickets.tech.onTheWay',
    onTheWayDone: 'serviceTickets.tech.onTheWayDone',
  },
  alert: {
    emergency: 'serviceTickets.alert.emergency',
    safetyWords: 'serviceTickets.alert.safetyWords',
    late: 'serviceTickets.alert.late',
    unsafe: 'serviceTickets.alert.unsafe',
    visitMissed: 'serviceTickets.alert.visitMissed',
  },
} as const;
