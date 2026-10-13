/** Screen 105 — Delivery Delay Alert & Escalation. Types and translation keys only. */

import type { DelayRootCause, DelaySeverity } from '@/data/types';

export type DeliveryDelayStatus = 'loading' | 'ready' | 'error';

/** How often the board re-reads while open. */
export const POLL_MS = 30_000;

export type DelayFilter = 'all' | DelaySeverity | 'untold';
export const DELAY_FILTERS: DelayFilter[] = ['all', 'critical', 'late', 'watch', 'untold'];

/** Offered in this order: the causes that are someone's to fix, then the one that is nobody's. */
export const ROOT_CAUSES: DelayRootCause[] = ['supplier_production', 'logistics_transit', 'customs_documentation', 'external_event'];

export const CONTACT_CHANNELS = ['in_app', 'phone', 'email', 'whatsapp', 'in_person'] as const;

/**
 * Screen 105 owns the shared `deliveryDelay.*` namespace: the cause labels
 * (also read by the scorecard, 097) and the two alert titles.
 */
export const DELIVERY_DELAY_KEYS = {
  title: 'deliveryDelay.title',
  subtitle: 'deliveryDelay.subtitle',
  loading: 'deliveryDelay.loading',
  error: { title: 'deliveryDelay.error.title', body: 'deliveryDelay.error.body' },
  alert: { delayed: 'deliveryDelay.alert.delayed', escalated: 'deliveryDelay.alert.escalated' },
  cause: {
    supplier_production: 'deliveryDelay.cause.supplier_production',
    logistics_transit: 'deliveryDelay.cause.logistics_transit',
    customs_documentation: 'deliveryDelay.cause.customs_documentation',
    external_event: 'deliveryDelay.cause.external_event',
  },
  causeHint: {
    supplier_production: 'deliveryDelay.causeHint.supplier_production',
    logistics_transit: 'deliveryDelay.causeHint.logistics_transit',
    customs_documentation: 'deliveryDelay.causeHint.customs_documentation',
    external_event: 'deliveryDelay.causeHint.external_event',
  },
  filter: {
    label: 'deliveryDelay.filter.label',
    search: 'deliveryDelay.filter.search',
    all: 'deliveryDelay.filter.all',
    critical: 'deliveryDelay.filter.critical',
    late: 'deliveryDelay.filter.late',
    watch: 'deliveryDelay.filter.watch',
    untold: 'deliveryDelay.filter.untold',
    select: 'deliveryDelay.filter.select',
    done: 'deliveryDelay.filter.done',
  },
  severity: {
    critical: 'deliveryDelay.severity.critical',
    late: 'deliveryDelay.severity.late',
    watch: 'deliveryDelay.severity.watch',
  },
  list: {
    openHeading: 'deliveryDelay.list.openHeading',
    openHint: 'deliveryDelay.list.openHint',
    recoveredHeading: 'deliveryDelay.list.recoveredHeading',
    emptyTitle: 'deliveryDelay.list.emptyTitle',
    emptyBody: 'deliveryDelay.list.emptyBody',
    emptyFilteredTitle: 'deliveryDelay.list.emptyFilteredTitle',
    emptyFilteredBody: 'deliveryDelay.list.emptyFilteredBody',
    clearFilter: 'deliveryDelay.list.clearFilter',
  },
  row: {
    lateBy: 'deliveryDelay.row.lateBy',
    trending: 'deliveryDelay.row.trending',
    hours: 'deliveryDelay.row.hours',
    days: 'deliveryDelay.row.days',
    blocks: 'deliveryDelay.row.blocks',
    tight: 'deliveryDelay.row.tight',
    told: 'deliveryDelay.row.told',
    notTold: 'deliveryDelay.row.notTold',
    retold: 'deliveryDelay.row.retold',
    untagged: 'deliveryDelay.row.untagged',
    escalated: 'deliveryDelay.row.escalated',
    recovered: 'deliveryDelay.row.recovered',
    delivered: 'deliveryDelay.row.delivered',
    recoveredNote: 'deliveryDelay.row.recoveredNote',
    recoveredTold: 'deliveryDelay.row.recoveredTold',
    select: 'deliveryDelay.row.select',
  },
  batch: {
    selected: 'deliveryDelay.batch.selected',
    tag: 'deliveryDelay.batch.tag',
    tell: 'deliveryDelay.batch.tell',
    tagTitle: 'deliveryDelay.batch.tagTitle',
    tagIntro: 'deliveryDelay.batch.tagIntro',
    tellTitle: 'deliveryDelay.batch.tellTitle',
    tellIntro: 'deliveryDelay.batch.tellIntro',
    tellSummary: 'deliveryDelay.batch.tellSummary',
    tellSend: 'deliveryDelay.batch.tellSend',
    cancel: 'deliveryDelay.batch.cancel',
  },
  sheet: {
    heldTo: 'deliveryDelay.sheet.heldTo',
    heldBooked: 'deliveryDelay.sheet.heldBooked',
    heldPromised: 'deliveryDelay.sheet.heldPromised',
    nowExpected: 'deliveryDelay.sheet.nowExpected',
    etaTracker: 'deliveryDelay.sheet.etaTracker',
    etaEstimate: 'deliveryDelay.sheet.etaEstimate',
    uncertain: 'deliveryDelay.sheet.uncertain',
    gap: 'deliveryDelay.sheet.gap',
    onTime: 'deliveryDelay.sheet.onTime',
    install: 'deliveryDelay.sheet.install',
    installBlocks: 'deliveryDelay.sheet.installBlocks',
    installTight: 'deliveryDelay.sheet.installTight',
    installFlexible: 'deliveryDelay.sheet.installFlexible',
    stage: 'deliveryDelay.sheet.stage',
    openedAt: 'deliveryDelay.sheet.openedAt',
    stepsHeading: 'deliveryDelay.sheet.stepsHeading',
  },
  causeSection: {
    heading: 'deliveryDelay.causeSection.heading',
    intro: 'deliveryDelay.causeSection.intro',
    select: 'deliveryDelay.causeSection.select',
    label: 'deliveryDelay.causeSection.label',
    labelHint: 'deliveryDelay.causeSection.labelHint',
    note: 'deliveryDelay.causeSection.note',
    save: 'deliveryDelay.causeSection.save',
    current: 'deliveryDelay.causeSection.current',
    moved: 'deliveryDelay.causeSection.moved',
    externalNote: 'deliveryDelay.causeSection.externalNote',
    placeholder: 'deliveryDelay.causeSection.placeholder',
  },
  contact: {
    heading: 'deliveryDelay.contact.heading',
    intro: 'deliveryDelay.contact.intro',
    channel: 'deliveryDelay.contact.channel',
    channel_in_app: 'deliveryDelay.contact.channel_in_app',
    channel_phone: 'deliveryDelay.contact.channel_phone',
    channel_email: 'deliveryDelay.contact.channel_email',
    channel_whatsapp: 'deliveryDelay.contact.channel_whatsapp',
    channel_in_person: 'deliveryDelay.contact.channel_in_person',
    noPortal: 'deliveryDelay.contact.noPortal',
    body: 'deliveryDelay.contact.body',
    bodyLogged: 'deliveryDelay.contact.bodyLogged',
    template: 'deliveryDelay.contact.template',
    expectsReply: 'deliveryDelay.contact.expectsReply',
    send: 'deliveryDelay.contact.send',
    log: 'deliveryDelay.contact.log',
    contacted: 'deliveryDelay.contact.contacted',
    openThread: 'deliveryDelay.contact.openThread',
  },
  customer: {
    heading: 'deliveryDelay.customer.heading',
    intro: 'deliveryDelay.customer.intro',
    preview: 'deliveryDelay.customer.preview',
    send: 'deliveryDelay.customer.send',
    resend: 'deliveryDelay.customer.resend',
    told: 'deliveryDelay.customer.told',
    stale: 'deliveryDelay.customer.stale',
    optedOut: 'deliveryDelay.customer.optedOut',
    tellAfterCause: 'deliveryDelay.customer.tellAfterCause',
  },
  escalate: {
    heading: 'deliveryDelay.escalate.heading',
    intro: 'deliveryDelay.escalate.intro',
    note: 'deliveryDelay.escalate.note',
    submit: 'deliveryDelay.escalate.submit',
    done: 'deliveryDelay.escalate.done',
  },
  links: {
    tracking: 'deliveryDelay.links.tracking',
    booking: 'deliveryDelay.links.booking',
    order: 'deliveryDelay.links.order',
  },
  toast: {
    tagged: 'deliveryDelay.toast.tagged',
    contacted: 'deliveryDelay.toast.contacted',
    logged: 'deliveryDelay.toast.logged',
    told: 'deliveryDelay.toast.told',
    nobodyTold: 'deliveryDelay.toast.nobodyTold',
    escalated: 'deliveryDelay.toast.escalated',
  },
  problem: {
    forbidden: 'deliveryDelay.problem.forbidden',
    not_found: 'deliveryDelay.problem.not_found',
    invalid_state: 'deliveryDelay.problem.invalid_state',
    invalid_input: 'deliveryDelay.problem.invalid_input',
    label_required: 'deliveryDelay.problem.label_required',
    no_portal: 'deliveryDelay.problem.no_portal',
    generic: 'deliveryDelay.problem.generic',
  },
  skipped: {
    opted_out: 'deliveryDelay.skipped.opted_out',
    no_contact: 'deliveryDelay.skipped.no_contact',
    already_told: 'deliveryDelay.skipped.already_told',
  },
} as const;
