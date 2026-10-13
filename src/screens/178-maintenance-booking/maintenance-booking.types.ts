export const POLL_MS = 30_000;
export const TRACK_POLL_MS = 10_000;
export const MAINTENANCE_PATH = '/maintenance';
export const bookingPath = (ticketId: string) => `/maintenance/${ticketId}`;
export const requestPath = '/service-requests?tab=new';
export const planPath = (jobId: string) => `/warranty/${jobId}`;
export const viewKey = (userId: string, job: string) => `aiec.maintenanceDesk.${userId}.${job || 'first'}`;
export const draftKey = (userId: string) => `aiec.maintenanceDraft.${userId}`;
/** Changes need this much notice (matches the booking rules in `@/features/service/booking`, said to the customer in hours). */
export const NOTICE_HOURS = 12;

export const MAINTENANCE_KEYS = {
  title: 'maintenance.title',
  subtitle: 'maintenance.subtitle',
  loading: 'maintenance.loading',
  error: {
    title: 'maintenance.error.title',
    body: 'maintenance.error.body',
  },
  refresh: 'maintenance.refresh',
  close: 'maintenance.close',
  back: 'maintenance.back',
  notFound: 'maintenance.notFound',
  link: {
    open: 'maintenance.link.open',
  },
  notice: {
    placeholders: 'maintenance.notice.placeholders',
  },
  noLift: {
    title: 'maintenance.noLift.title',
    body: 'maintenance.noLift.body',
  },
  urgent: {
    title: 'maintenance.urgent.title',
    body: 'maintenance.urgent.body',
    cta: 'maintenance.urgent.cta',
    call: 'maintenance.urgent.call',
  },
  lift: {
    label: 'maintenance.lift.label',
  },
  cover: {
    title: 'maintenance.cover.title',
    state: {
      active: 'maintenance.cover.state.active',
      expiring: 'maintenance.cover.state.expiring',
      lapsed: 'maintenance.cover.state.lapsed',
      warranty: 'maintenance.cover.state.warranty',
      none: 'maintenance.cover.state.none',
    },
    visits: 'maintenance.cover.visits',
    renew: {
      expiring: 'maintenance.cover.renew.expiring',
      lapsed: 'maintenance.cover.renew.lapsed',
      none: 'maintenance.cover.renew.none',
      cta: 'maintenance.cover.renew.cta',
    },
    chargeable: 'maintenance.cover.chargeable',
    chargeableNoPrice: 'maintenance.cover.chargeableNoPrice',
    free: 'maintenance.cover.free',
  },
  purpose: {
    title: 'maintenance.purpose.title',
    routine: {
      title: 'maintenance.purpose.routine.title',
      body: 'maintenance.purpose.routine.body',
    },
    adhoc: {
      title: 'maintenance.purpose.adhoc.title',
      body: 'maintenance.purpose.adhoc.body',
    },
  },
  note: {
    label: {
      routine: 'maintenance.note.label.routine',
      adhoc: 'maintenance.note.label.adhoc',
    },
    hint: 'maintenance.note.hint',
  },
  slots: {
    title: 'maintenance.slots.title',
    none: {
      skill_gap: 'maintenance.slots.none.skill_gap',
      none_soon: 'maintenance.slots.none.none_soon',
      none_in_window: 'maintenance.slots.none.none_in_window',
    },
    earliest: 'maintenance.slots.earliest',
    day: {
      none: 'maintenance.slots.day.none',
    },
    arrangeTitle: 'maintenance.slots.arrangeTitle',
    arrange: {
      body: 'maintenance.slots.arrange.body',
    },
  },
  window: {
    morning: 'maintenance.window.morning',
    afternoon: 'maintenance.window.afternoon',
  },
  tech: {
    title: 'maintenance.tech.title',
    rating: 'maintenance.tech.rating',
    unrated: 'maintenance.tech.unrated',
    jobs: 'maintenance.tech.jobs',
    note: 'maintenance.tech.note',
  },
  confirm: {
    submit: 'maintenance.confirm.submit',
    arrange: 'maintenance.confirm.arrange',
    sending: 'maintenance.confirm.sending',
  },
  done: {
    title: 'maintenance.done.title',
    pending: {
      title: 'maintenance.done.pending.title',
    },
    body: 'maintenance.done.body',
    pendingBody: 'maintenance.done.pendingBody',
    reference: 'maintenance.done.reference',
    open: 'maintenance.done.open',
  },
  bookings: {
    title: 'maintenance.bookings.title',
    empty: 'maintenance.bookings.empty',
    when: 'maintenance.bookings.when',
    pending: 'maintenance.bookings.pending',
  },
  detail: {
    technician: 'maintenance.detail.technician',
    rescheduleOpen: 'maintenance.detail.rescheduleOpen',
    reschedule: {
      hint: 'maintenance.detail.reschedule.hint',
      confirm: 'maintenance.detail.reschedule.confirm',
    },
    cancelOpen: 'maintenance.detail.cancelOpen',
    cancel: {
      title: 'maintenance.detail.cancel.title',
      body: 'maintenance.detail.cancel.body',
      reason: 'maintenance.detail.cancel.reason',
      confirm: 'maintenance.detail.cancel.confirm',
      keep: 'maintenance.detail.cancel.keep',
    },
    moved: 'maintenance.detail.moved',
  },
  track: {
    title: 'maintenance.track.title',
    not_today: 'maintenance.track.not_today',
    scheduled: 'maintenance.track.scheduled',
    on_the_way: 'maintenance.track.on_the_way',
    eta: 'maintenance.track.eta',
    noEta: 'maintenance.track.noEta',
    arrived: 'maintenance.track.arrived',
    done: 'maintenance.track.done',
    missed: 'maintenance.track.missed',
    cancelled: 'maintenance.track.cancelled',
  },
  problem: {
    date_past: 'maintenance.problem.date_past',
    too_far: 'maintenance.problem.too_far',
    date_invalid: 'maintenance.problem.date_invalid',
    not_working_day: 'maintenance.problem.not_working_day',
    notice_short: 'maintenance.problem.notice_short',
    slot_taken: 'maintenance.problem.slot_taken',
    lift_required: 'maintenance.problem.lift_required',
    not_handed_over: 'maintenance.problem.not_handed_over',
    note_required: 'maintenance.problem.note_required',
    purpose_invalid: 'maintenance.problem.purpose_invalid',
    invalid_state: 'maintenance.problem.invalid_state',
    note_short: 'maintenance.problem.note_short',
    generic: 'maintenance.problem.generic',
  },
} as const;
