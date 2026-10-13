/** Screen 122 — Job Detail & Site Info. Types and translation keys only. */

import type { JobMaterialState, JobSpecView } from '@/data/repository';
import type { Language } from '@/data/types';

export type JobDetailStatus = 'loading' | 'ready' | 'error' | 'not_found';

/** How often the job re-reads while open, so a changed configuration or a part that arrived shows up without a reload. */
export const POLL_MS = 20_000;
/** A note older than this is flagged, so an old remark about site access is not read as current. */
export const NOTE_STALE_DAYS = 30;

export const SPEC_FIELDS: JobSpecField[] = ['driveType', 'capacityPersons', 'capacityKg', 'stopsCount', 'travelHeightM', 'finishTier'];
export type JobSpecField = keyof Pick<JobSpecView, 'driveType' | 'capacityPersons' | 'capacityKg' | 'stopsCount' | 'travelHeightM' | 'finishTier'>;

export const MATERIAL_STATES: JobMaterialState[] = ['on_site', 'awaiting_signature', 'in_transit', 'preparing', 'issue'];
export const TOPICS = ['access', 'contact', 'safety', 'other'] as const;
export const SOURCES = ['survey', 'sales', 'terms'] as const;
export const LANGUAGES: Language[] = ['en', 'hi', 'mr'];

/** The SOP checklist (123) is where the work itself is recorded; this screen only leads there. */
export const sopPath = (id: string) => `/technician/jobs/${id}/sop`;
export const homePath = '/technician';
/** A phone's own navigation app, given the site's coordinates. */
export const navigateUrl = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const JOB_KEYS = {
  title: 'technicianJob.title',
  loading: 'technicianJob.loading',
  back: 'technicianJob.back',
  error: { title: 'technicianJob.error.title', body: 'technicianJob.error.body' },
  notFound: { title: 'technicianJob.notFound.title', body: 'technicianJob.notFound.body' },
  /** Shared with the home screen (121), which owns these words. */
  shared: {
    status: (s: string) => `technicianHome.status.${s}`,
    role: (r: string) => `technicianHome.role.${r}`,
    stepStatus: (s: string) => `technicianHome.stepStatus.${s}`,
    stage: 'technicianHome.stage.label',
    progress: 'technicianHome.stage.progress',
    yourPart: 'technicianHome.role.yourPart',
    assisting: 'technicianHome.role.assisting',
    hold: 'technicianHome.hold.reason',
  },
  spec: {
    heading: 'technicianJob.spec.heading',
    source: 'technicianJob.spec.source',
    field: rec('technicianJob.spec.field', ['driveType', 'capacity', 'stopsCount', 'travelHeightM', 'finishTier'] as const),
    capacityValue: 'technicianJob.spec.capacityValue',
    metres: 'technicianJob.spec.metres',
    stops: 'technicianJob.spec.stops',
    override: 'technicianJob.spec.override',
    custom: 'technicianJob.spec.custom',
    changedBadge: 'technicianJob.spec.changedBadge',
    revised: 'technicianJob.spec.revised',
    noneTitle: 'technicianJob.spec.noneTitle',
    noneBody: 'technicianJob.spec.noneBody',
  },
  changed: {
    title: 'technicianJob.changed.title',
    body: 'technicianJob.changed.body',
    line: 'technicianJob.changed.line',
    ack: 'technicianJob.changed.ack',
  },
  site: {
    heading: 'technicianJob.site.heading',
    navigate: 'technicianJob.site.navigate',
    map: 'technicianJob.site.map',
    shaft: 'technicianJob.site.shaft',
    mm: 'technicianJob.site.mm',
    width: 'technicianJob.site.width',
    depth: 'technicianJob.site.depth',
    pit: 'technicianJob.site.pit',
    headroom: 'technicianJob.site.headroom',
    floors: 'technicianJob.site.floors',
    machineRoom: 'technicianJob.site.machineRoom',
    machineRoomValue: { mrl: 'technicianJob.site.machineRoomValue.mrl', with_machine_room: 'technicianJob.site.machineRoomValue.with_machine_room', unknown: 'technicianJob.site.machineRoomValue.unknown' },
  },
  customer: {
    heading: 'technicianJob.customer.heading',
    call: 'technicianJob.customer.call',
    prefers: 'technicianJob.customer.prefers',
    language: rec('technicianJob.customer.language', LANGUAGES),
    unknown: 'technicianJob.customer.unknown',
  },
  materials: {
    heading: 'technicianJob.materials.heading',
    summary: 'technicianJob.materials.summary',
    allOnSite: 'technicianJob.materials.allOnSite',
    notAll: 'technicianJob.materials.notAll',
    confirmedOn: 'technicianJob.materials.confirmedOn',
    noOrders: 'technicianJob.materials.noOrders',
    state: rec('technicianJob.materials.state', MATERIAL_STATES),
    expected: 'technicianJob.materials.expected',
    order: 'technicianJob.materials.order',
    other: 'technicianJob.materials.other',
  },
  notes: {
    heading: 'technicianJob.notes.heading',
    intro: 'technicianJob.notes.intro',
    empty: 'technicianJob.notes.empty',
    today: 'technicianJob.notes.today',
    age: 'technicianJob.notes.age',
    stale: 'technicianJob.notes.stale',
    by: 'technicianJob.notes.by',
    topic: rec('technicianJob.notes.topic', TOPICS),
    source: rec('technicianJob.notes.source', SOURCES),
  },
  team: {
    heading: 'technicianJob.team.heading',
    alone: 'technicianJob.team.alone',
    you: 'technicianJob.team.you',
    steps: 'technicianJob.team.steps',
    call: 'technicianJob.team.call',
  },
  onSite: { heading: 'technicianJob.onSite.heading', none: 'technicianJob.onSite.none', now: 'technicianJob.onSite.now', total: 'technicianJob.onSite.total', open: 'technicianJob.onSite.open', stale: 'technicianJob.onSite.stale' },
  repeat: {
    heading: 'technicianJob.repeat.heading',
    body: 'technicianJob.repeat.body',
    earlier: 'technicianJob.repeat.earlier',
    carried: 'technicianJob.repeat.carried',
    carriedHint: 'technicianJob.repeat.carriedHint',
  },
  action: {
    sop: 'technicianJob.action.sop',
    mine: 'technicianJob.action.mine',
    waiting: 'technicianJob.action.waiting',
    hold: 'technicianJob.action.hold',
    safety: 'technicianJob.action.safety',
    issue: 'technicianJob.action.issue',
    waitingHint: 'technicianJob.action.waitingHint',
    holdHint: 'technicianJob.action.holdHint',
  },
} as const;
