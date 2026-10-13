/** Screen 151 — Training Module Library. Types and translation keys only. */

import { TOPICS } from '@/features/training/curriculum';
import type { TrainingScope } from '@/data/repository';

export const SCOPES: TrainingScope[] = ['required', 'mine', 'all'];
export const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'completed'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];
export const DEFAULT_SCOPE: TrainingScope = 'mine';
export const offlineKey = (userId: string) => `aiec.trainingOffline.${userId}`;
export const cacheKey = (userId: string) => `aiec.trainingLib.${userId}`;
/** 152 plays a module here. */
/** 153 holds the procedures technicians are held to. */
export const sopPath = '/sops';
export const certificationsPath = '/certifications';
export const assessmentPath = (moduleId: string) => `/assessment/${moduleId}`;
export const modulePath = (moduleId: string) => `/training/${moduleId}`;
export { TOPICS };

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const PROBLEMS = ['forbidden', 'not_found', 'locked', 'not_for_you', 'retired', 'invalid_state', 'no_lessons', 'offline', 'generic'] as const;

export const LIB_KEYS = {
  title: 'trainingLib.title',
  subtitle: 'trainingLib.subtitle',
  loading: 'trainingLib.loading',
  error: { title: 'trainingLib.error.title', body: 'trainingLib.error.body' },
  role: rec('trainingLib.role', ['surveyor', 'technician', 'supplier'] as const),
  topic: { all: 'trainingLib.topic.all', ...rec('trainingLib.topic', TOPICS) },
  scope: { label: 'trainingLib.scope.label', ...rec('trainingLib.scope', ['required', 'mine', 'all'] as const) },
  statusFilter: { label: 'trainingLib.statusFilter.label', ...rec('trainingLib.statusFilter', STATUS_FILTERS) },
  status: rec('trainingLib.status', ['not_started', 'in_progress', 'completed', 'update_needed'] as const),
  search: { label: 'trainingLib.search.label', placeholder: 'trainingLib.search.placeholder' },
  hero: {
    heading: 'trainingLib.hero.heading',
    done: 'trainingLib.hero.done',
    left: 'trainingLib.hero.left',
    allDone: 'trainingLib.hero.allDone',
    nothing: 'trainingLib.hero.nothing',
    updateNeeded: 'trainingLib.hero.updateNeeded',
    roles: 'trainingLib.hero.roles',
    certs: 'trainingLib.hero.certs',
  },
  gate: {
    heading: 'trainingLib.gate.heading',
    blocked: 'trainingLib.gate.blocked',
    cleared: 'trainingLib.gate.cleared',
    first: 'trainingLib.gate.first',
    test: 'trainingLib.gate.test',
  },
  group: { progress: 'trainingLib.group.progress', none: 'trainingLib.group.none' },
  row: {
    minutes: 'trainingLib.row.minutes',
    lessons: 'trainingLib.row.lessons',
    required: 'trainingLib.row.required',
    optional: 'trainingLib.row.optional',
    gates: 'trainingLib.row.gates',
    locked: 'trainingLib.row.locked',
    updated: 'trainingLib.row.updated',
    newVersion: 'trainingLib.row.newVersion',
    saved: 'trainingLib.row.saved',
    otherRole: 'trainingLib.row.otherRole',
    needsSignal: 'trainingLib.row.needsSignal',
    soon: 'trainingLib.row.soon',
    certified: 'trainingLib.row.certified',
    testToTake: 'trainingLib.row.testToTake',
    testWait: 'trainingLib.row.testWait',
    assigned: 'trainingLib.row.assigned',
  },
  empty: { title: 'trainingLib.empty.title', body: 'trainingLib.empty.body' },
  noMatch: { title: 'trainingLib.noMatch.title', body: 'trainingLib.noMatch.body', action: 'trainingLib.noMatch.action' },
  offline: { banner: 'trainingLib.offline.banner', cached: 'trainingLib.offline.cached' },
  detail: {
    about: 'trainingLib.detail.about',
    facts: 'trainingLib.detail.facts',
    duration: 'trainingLib.detail.duration',
    lessons: 'trainingLib.detail.lessons',
    version: 'trainingLib.detail.version',
    forRoles: 'trainingLib.detail.forRoles',
    changed: 'trainingLib.detail.changed',
    changedSince: 'trainingLib.detail.changedSince',
    retake: 'trainingLib.detail.retake',
    buildsOn: 'trainingLib.detail.buildsOn',
    lockedBody: 'trainingLib.detail.lockedBody',
    openFirst: 'trainingLib.detail.openFirst',
    gatesBody: 'trainingLib.detail.gatesBody',
    completedOn: 'trainingLib.detail.completedOn',
    progress: 'trainingLib.detail.progress',
    start: 'trainingLib.detail.start',
    continue: 'trainingLib.detail.continue',
    review: 'trainingLib.detail.review',
    retakeButton: 'trainingLib.detail.retakeButton',
    notForYou: 'trainingLib.detail.notForYou',
    soonBody: 'trainingLib.detail.soonBody',
    testHeading: 'trainingLib.detail.testHeading',
    testBody: rec('trainingLib.detail.testBody', ['locked', 'to_take', 'in_progress', 'cooldown', 'certified'] as const),
    testOpen: 'trainingLib.detail.testOpen',
    assignedBody: 'trainingLib.detail.assignedBody',
    testNeeded: 'trainingLib.detail.testNeeded',
  },
  offlineCopy: {
    save: 'trainingLib.offlineCopy.save',
    saved: 'trainingLib.offlineCopy.saved',
    remove: 'trainingLib.offlineCopy.remove',
    size: 'trainingLib.offlineCopy.size',
    stale: 'trainingLib.offlineCopy.stale',
    savedToast: 'trainingLib.offlineCopy.savedToast',
    removedToast: 'trainingLib.offlineCopy.removedToast',
    needsSignal: 'trainingLib.offlineCopy.needsSignal',
    hint: 'trainingLib.offlineCopy.hint',
  },
  sop: { heading: 'trainingLib.sop.heading', body: 'trainingLib.sop.body', open: 'trainingLib.sop.open' },
  close: 'trainingLib.close',
  problem: rec('trainingLib.problem', PROBLEMS),
} as const;

/** The content of a module is translation keys under its code. */
export const contentKey = (code: string, key: 'title' | 'summary' | 'change2') => `trainingLib.content.${code.toLowerCase()}.${key}`;
