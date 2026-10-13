/** Screen 139 — Warranty & AMC Registration. Types and translation keys only. */

import { TIERS } from '@/features/qc/warranty';

export type WarrantyStatus = 'loading' | 'ready' | 'error' | 'not_found';
export const POLL_MS = 20_000;
export const draftKey = (userId: string, jobId: string) => `aiec.warrantyDraft.${userId}.${jobId}`;
export const CHOICES = ['enrol', 'later', 'declined'] as const;
export type Choice = (typeof CHOICES)[number];

export const FINAL_ERRORS = ['not_ready', 'already_registered', 'not_registered', 'tier_required', 'extra_visits_invalid', 'customization_note_required', 'not_admin', 'invalid_state', 'not_found', 'forbidden', 'choice_required', 'no_amc_tiers', 'too_early'] as const;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
export const boardPath = '/warranty';
export const certificatePath = (id: string) => `/handover-certificate/${id}`;
export const walkthroughPath = (id: string) => `/handover-walkthrough/${id}`;

export const WARRANTY_KEYS = {
  title: 'warranty.title',
  loading: 'warranty.loading',
  back: 'warranty.back',
  error: { title: 'warranty.error.title', body: 'warranty.error.body' },
  notFound: { title: 'warranty.notFound.title', body: 'warranty.notFound.body', action: 'warranty.notFound.action' },
  notReady: { title: 'warranty.notReady.title', body: 'warranty.notReady.body', customerBody: 'warranty.notReady.customerBody', action: 'warranty.notReady.action' },
  board: { heading: 'warranty.board.heading', emptyTitle: 'warranty.board.emptyTitle', emptyBody: 'warranty.board.emptyBody' },
  problem: rec('warranty.problem', [...FINAL_ERRORS, 'offline', 'generic'] as const),
  status: rec('warranty.status', ['not_ready', 'ready', 'registered'] as const),
  amcStatus: rec('warranty.amcStatus', ['active', 'later', 'declined'] as const),
  hero: { starts: 'warranty.hero.starts', intro: 'warranty.hero.intro', frozen: 'warranty.hero.frozen', preview: 'warranty.hero.preview' },
  layers: {
    heading: 'warranty.layers.heading',
    manufacturer: 'warranty.layers.manufacturer',
    manufacturerBody: 'warranty.layers.manufacturerBody',
    service: 'warranty.layers.service',
    serviceBody: 'warranty.layers.serviceBody',
    amc: 'warranty.layers.amc',
    amcBody: 'warranty.layers.amcBody',
    notCovered: 'warranty.layers.notCovered',
    notCoveredBody: 'warranty.layers.notCoveredBody',
  },
  parts: {
    heading: 'warranty.parts.heading',
    intro: 'warranty.parts.intro',
    none: 'warranty.parts.none',
    line: 'warranty.parts.line',
    months: 'warranty.parts.months',
    until: 'warranty.parts.until',
    receipt: 'warranty.parts.receipt',
    substituted: 'warranty.parts.substituted',
    substitutedHint: 'warranty.parts.substitutedHint',
    by: 'warranty.parts.by',
  },
  service: { heading: 'warranty.service.heading', line: 'warranty.service.line', note: 'warranty.service.note' },
  basis: 'warranty.basis',
  amc: {
    heading: 'warranty.amc.heading',
    intro: 'warranty.amc.intro',
    tier: rec('warranty.amc.tier', TIERS),
    tierLine: 'warranty.amc.tierLine',
    begins: 'warranty.amc.begins',
    choice: rec('warranty.amc.choice', CHOICES),
    choiceHint: rec('warranty.amc.choiceHint', CHOICES),
    walkthrough: 'warranty.amc.walkthrough',
    tierLabel: 'warranty.amc.tierLabel',
    customHeading: 'warranty.amc.customHeading',
    customHint: 'warranty.amc.customHint',
    extra: 'warranty.amc.extra',
    extraHint: 'warranty.amc.extraHint',
    note: 'warranty.amc.note',
    noteAdminHint: 'warranty.amc.noteAdminHint',
    noteHint: 'warranty.amc.noteHint',
    noteOk: 'warranty.amc.noteOk',
    price: 'warranty.amc.price',
    priceExtra: 'warranty.amc.priceExtra',
  },
  register: { button: 'warranty.register.button', waiting: 'warranty.register.waiting', toast: 'warranty.register.toast', draftRestored: 'warranty.register.draftRestored' },
  reminders: {
    heading: 'warranty.reminders.heading',
    intro: 'warranty.reminders.intro',
    previewLine: 'warranty.reminders.previewLine',
    kind: rec('warranty.reminders.kind', ['warranty_ending', 'amc_renewal', 'amc_reengage'] as const),
    sent: 'warranty.reminders.sent',
    scheduled: 'warranty.reminders.scheduled',
    skipped: rec('warranty.reminders.skipped', ['opted_out', 'no_contact', 'enrolled', 'superseded'] as const),
    none: 'warranty.reminders.none',
  },
  registered: {
    heading: 'warranty.registered.heading',
    line: 'warranty.registered.line',
    amcActive: 'warranty.registered.amcActive',
    term: 'warranty.registered.term',
    later: 'warranty.registered.later',
    declined: 'warranty.registered.declined',
    reconsider: 'warranty.registered.reconsider',
    reconsiderBody: 'warranty.registered.reconsiderBody',
    enrolGo: 'warranty.registered.enrolGo',
    enrolToast: 'warranty.registered.enrolToast',
    renew: 'warranty.registered.renew',
    renewToast: 'warranty.registered.renewToast',
    renewFrom: 'warranty.registered.renewFrom',
    custom: 'warranty.registered.custom',
    certificate: 'warranty.registered.certificate',
  },
} as const;
