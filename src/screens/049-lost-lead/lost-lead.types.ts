/** Screen 049 — Lost Lead Disqualification. Types and translation keys only. */

export type LostLeadStatus = 'loading' | 'ready' | 'not_found' | 'error';

export const LOST_REASON_KEYS = ['price', 'timeline', 'competitor', 'site_not_ready', 'unresponsive', 'not_a_fit'] as const;
export type LostReasonKey = (typeof LOST_REASON_KEYS)[number];

/** 0 means no reminder. */
export const REVISIT_MONTH_OPTIONS = [0, 1, 3, 6, 12] as const;

export const LOST_LEAD_KEYS = {
  loading: 'lostLead.loading',
  notFound: { title: 'lostLead.notFound.title', body: 'lostLead.notFound.body' },
  error: { title: 'lostLead.error.title', body: 'lostLead.error.body' },
  title: 'lostLead.title',
  subtitle: 'lostLead.subtitle',

  glance: {
    heading: 'lostLead.glance.heading',
    stage: 'lostLead.glance.stage',
    value: 'lostLead.glance.value',
    owner: 'lostLead.glance.owner',
    recentActivity: 'lostLead.glance.recentActivity',
    noActivity: 'lostLead.glance.noActivity',
  },
  eventKind: {
    captured: 'lostLead.eventKind.captured',
    stage_changed: 'lostLead.eventKind.stage_changed',
    note_added: 'lostLead.eventKind.note_added',
    assigned: 'lostLead.eventKind.assigned',
    reassigned: 'lostLead.eventKind.reassigned',
    communication_sent: 'lostLead.eventKind.communication_sent',
    communication_failed: 'lostLead.eventKind.communication_failed',
    quote_created: 'lostLead.eventKind.quote_created',
    quote_change_requested: 'lostLead.eventKind.quote_change_requested',
    task_completed: 'lostLead.eventKind.task_completed',
    merged: 'lostLead.eventKind.merged',
    marked_lost: 'lostLead.eventKind.marked_lost',
    reopened: 'lostLead.eventKind.reopened',
  },

  reasonLabel: 'lostLead.reasonLabel',
  noteLabel: 'lostLead.noteLabel',
  notePlaceholder: 'lostLead.notePlaceholder',
  revisitLabel: 'lostLead.revisitLabel',
  revisit: {
    none: 'lostLead.revisit.none',
    m1: 'lostLead.revisit.m1',
    m3: 'lostLead.revisit.m3',
    m6: 'lostLead.revisit.m6',
    m12: 'lostLead.revisit.m12',
  },
  revisitHint: 'lostLead.revisitHint',

  confirm: 'lostLead.confirm',
  cancel: 'lostLead.cancel',

  alreadyLost: {
    title: 'lostLead.alreadyLost.title',
    body: 'lostLead.alreadyLost.body',
    reopen: 'lostLead.alreadyLost.reopen',
  },

  toast: {
    marked: 'lostLead.toast.marked',
    reopened: 'lostLead.toast.reopened',
    error: 'lostLead.toast.error',
  },
} as const;
