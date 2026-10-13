/** Screen 142 — Applicant Data Collection Form. Types and translation keys only. */

import { DAYS, HOURS, LANGUAGES, SECTIONS, SUMMARY_MIN, TIMES, TRAVEL, YEARS } from '@/features/recruitment/application';

export type ApplicationStatus = 'loading' | 'ready' | 'error' | 'invalid' | 'not_found';
export const POLL_MS = 30_000;
export const SAVE_DELAY_MS = 1200;
export const draftKey = (id: string) => `aiec.applyDraft.${id}`;
export const keyKey = (id: string) => `aiec.application.${id}`;
export const boardPath = '/applications';
export const screeningPath = (id: string) => `/screening?app=${id}`;
export const applyPath = (id: string) => `/apply/${id}`;
export const detailPath = (id: string) => `/applications/${id}`;
export { SUMMARY_MIN };

const rec = <T extends string | number>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const MISSING = ['name', 'phone', 'city', 'languages', 'age', 'years', 'experience', 'zones', 'days', 'time', 'hours', 'start', 'references', 'reference_name', 'reference_phone', 'reference_relationship', 'identity', 'gstin', 'gst_doc'] as const;
const PROBLEMS = ['incomplete', 'locked', 'invalid_link', 'forbidden', 'not_found', 'note_required', 'offline', 'generic'] as const;
export const OUTCOMES = ['verified', 'unreachable', 'declined'] as const;
const OUTSTANDING = ['reference_unchecked', 'reference_unreachable', 'reference_declined', 'no_references'] as const;
export const STATUSES = ['draft', 'submitted', 'info_requested', 'approved', 'rejected', 'withdrawn'] as const;
const EVENTS = ['started', 'saved', 'submitted', 'resubmitted', 'reference_outcome', 'info_requested', 'info_answered', 'approved', 'rejected', 'adjusted', 'outcome'] as const;

export const APPLICATION_KEYS = {
  title: 'application.title',
  loading: 'application.loading',
  brand: 'application.brand',
  language: 'application.language',
  invalid: { title: 'application.invalid.title', body: 'application.invalid.body', action: 'application.invalid.action' },
  error: { title: 'application.error.title', body: 'application.error.body' },
  status: rec('application.status', STATUSES),
  progress: {
    heading: 'application.progress.heading',
    line: 'application.progress.line',
    saved: 'application.progress.saved',
    saving: 'application.progress.saving',
    offline: 'application.progress.offline',
    failed: 'application.progress.failed',
    restored: 'application.progress.restored',
    locked: 'application.progress.locked',
    rail: 'application.progress.rail',
  },
  section: {
    title: rec('application.section.title', SECTIONS),
    intro: rec('application.section.intro', SECTIONS),
    done: 'application.section.done',
    pending: 'application.section.pending',
    optional: 'application.section.optional',
  },
  missing: rec('application.missing', MISSING),
  field: {
    name: 'application.field.name',
    phone: 'application.field.phone',
    phoneLocked: 'application.field.phoneLocked',
    city: 'application.field.city',
    address: 'application.field.address',
    dob: 'application.field.dob',
    dobHint: 'application.field.dobHint',
    languages: 'application.field.languages',
    language: rec('application.field.language', LANGUAGES),
    years: 'application.field.years',
    year: rec('application.field.year', YEARS),
    skills: 'application.field.skills',
    sectors: 'application.field.sectors',
    sector: { real_estate: 'application.field.sector.real_estate', construction: 'application.field.sector.construction', elevators: 'application.field.sector.elevators', other_sales: 'application.field.sector.other_sales' },
    categories: 'application.field.categories',
    summary: 'application.field.summary',
    summaryHint: 'application.field.summaryHint',
    summaryOk: 'application.field.summaryOk',
    zones: 'application.field.zones',
    zonesHint: 'application.field.zonesHint',
    zonesNone: 'application.field.zonesNone',
    travel: 'application.field.travel',
    travelOption: 'application.field.travelOption',
    ownTransport: 'application.field.ownTransport',
    days: 'application.field.days',
    day: rec('application.field.day', DAYS),
    time: 'application.field.time',
    timeOption: rec('application.field.timeOption', TIMES),
    hours: 'application.field.hours',
    hoursOption: 'application.field.hoursOption',
    start: 'application.field.start',
    startHint: 'application.field.startHint',
  },
  references: {
    add: 'application.references.add',
    remove: 'application.references.remove',
    name: 'application.references.name',
    phone: 'application.references.phone',
    relationship: 'application.references.relationship',
    organisation: 'application.references.organisation',
    none: 'application.references.none',
    noneNote: 'application.references.noneNote',
    count: 'application.references.count',
    unreachableNote: 'application.references.unreachableNote',
    max: 'application.references.max',
  },
  identity: {
    personIntro: 'application.identity.personIntro',
    aadhaar: 'application.identity.aadhaar',
    aadhaarDoc: 'application.identity.aadhaarDoc',
    aadhaarOnFile: 'application.identity.aadhaarOnFile',
    or: 'application.identity.or',
    pan: 'application.identity.pan',
    panDoc: 'application.identity.panDoc',
    firmIntro: 'application.identity.firmIntro',
    gstin: 'application.identity.gstin',
    gstDoc: 'application.identity.gstDoc',
    valid: 'application.identity.valid',
    later: 'application.identity.later',
  },
  request: { heading: 'application.request.heading', body: 'application.request.body', go: 'application.request.go' },
  messages: { heading: 'application.messages.heading' },
  submit: { button: 'application.submit.button', resubmit: 'application.submit.resubmit', waiting: 'application.submit.waiting' },
  done: { heading: 'application.done.heading', body: 'application.done.body', outstanding: 'application.done.outstanding', edit: 'application.done.edit', next: 'application.done.next' },
  problem: rec('application.problem', PROBLEMS),
  admin: {
    title: 'application.admin.title',
    board: {
      heading: 'application.admin.board.heading',
      draft: 'application.admin.board.draft',
      submitted: 'application.admin.board.submitted',
      outstanding: 'application.admin.board.outstanding',
      emptyTitle: 'application.admin.board.emptyTitle',
      emptyBody: 'application.admin.board.emptyBody',
      row: 'application.admin.board.row',
      filterAll: 'application.admin.board.filterAll',
      none: 'application.admin.board.none',
    },
    role: { surveyor: 'application.admin.role.surveyor', technician: 'application.admin.role.technician', supplier: 'application.admin.role.supplier' },
    detail: {
      back: 'application.admin.detail.back',
      source: 'application.admin.detail.source',
      channel: { qr: 'application.admin.detail.channel.qr', social: 'application.admin.detail.channel.social', referral: 'application.admin.detail.channel.referral', whatsapp: 'application.admin.detail.channel.whatsapp', walk_in: 'application.admin.detail.channel.walk_in', event: 'application.admin.detail.channel.event', website: 'application.admin.detail.channel.website', other: 'application.admin.detail.channel.other' },
      timeline: 'application.admin.detail.timeline',
      event: rec('application.admin.detail.event', EVENTS),
      screening: 'application.admin.detail.screening',
      outstanding: 'application.admin.detail.outstanding',
      nothingOutstanding: 'application.admin.detail.nothingOutstanding',
      notStarted: 'application.admin.detail.notStarted',
      docOnFile: 'application.admin.detail.docOnFile',
      docMissing: 'application.admin.detail.docMissing',
      empty: 'application.admin.detail.empty',
    },
    outstanding: rec('application.admin.outstandingKind', OUTSTANDING),
    outcome: {
      heading: 'application.admin.outcome.heading',
      label: rec('application.admin.outcome.label', OUTCOMES),
      note: 'application.admin.outcome.note',
      save: 'application.admin.outcome.save',
      saved: 'application.admin.outcome.saved',
      by: 'application.admin.outcome.by',
      callHint: 'application.admin.outcome.callHint',
    },
  },
} as const;
