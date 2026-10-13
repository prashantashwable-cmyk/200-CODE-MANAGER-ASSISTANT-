/** Screen 156 — Refresher Training Reminder. Constants and translation keys only. */

import type { RefresherError, RefresherTierName } from '@/data/repository';
import { MAX_EXTENSION_DAYS, MAX_GRACE_DAYS, MAX_MONTHS, NOTE_MIN } from '@/features/training/refresher';

export { MAX_EXTENSION_DAYS, MAX_GRACE_DAYS, MAX_MONTHS, NOTE_MIN };
export const TIERS: RefresherTierName[] = ['blocked', 'grace', 'extended', 'due', 'upcoming'];
export const TABS = ['queue', 'cadence'] as const;
export type Tab = (typeof TABS)[number];
export const ROLES = ['surveyor', 'technician', 'supplier'] as const;
export const PAGE = 20;
export const POLL_MS = 60_000;
export const assessmentPath = (moduleId: string) => `/assessment/${moduleId}`;
export const lessonsPath = (moduleId: string) => `/training/${moduleId}`;
export const certificationsPath = '/certifications';
export const directoryPath = (q: string) => `/partner-directory?q=${encodeURIComponent(q)}`;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const PROBLEMS: (RefresherError | 'generic')[] = ['forbidden', 'not_admin', 'not_found', 'nothing_to_extend', 'date_invalid', 'date_in_past', 'too_long', 'reason_required', 'months_range', 'grace_range', 'no_assessment', 'too_soon', 'generic'];

export const REFRESH_KEYS = {
  title: 'refreshers.title',
  subtitleAdmin: 'refreshers.subtitleAdmin',
  subtitleSelf: 'refreshers.subtitleSelf',
  loading: 'refreshers.loading',
  error: { title: 'refreshers.error.title', body: 'refreshers.error.body' },
  tab: rec('refreshers.tab', TABS),
  tier: rec('refreshers.tier', TIERS),
  tierAll: 'refreshers.tierAll',
  search: { label: 'refreshers.search.label', placeholder: 'refreshers.search.placeholder' },
  filter: { safety: 'refreshers.filter.safety', role: 'refreshers.filter.role', anyRole: 'refreshers.filter.anyRole', clear: 'refreshers.filter.clear' },
  role: rec('refreshers.role', ROLES),
  summary: { count: 'refreshers.summary.count', safety: 'refreshers.summary.safety' },
  empty: { title: 'refreshers.empty.title', body: 'refreshers.empty.body' },
  emptySelf: { title: 'refreshers.emptySelf.title', body: 'refreshers.emptySelf.body', action: 'refreshers.emptySelf.action' },
  noMatch: { title: 'refreshers.noMatch.title', body: 'refreshers.noMatch.body' },
  more: { shown: 'refreshers.more.shown', button: 'refreshers.more.button' },
  row: {
    safety: 'refreshers.row.safety',
    refresher: 'refreshers.row.refresher',
    upcoming: 'refreshers.row.upcoming',
    due: 'refreshers.row.due',
    grace: 'refreshers.row.grace',
    extended: 'refreshers.row.extended',
    blocked: 'refreshers.row.blocked',
    openJobs: 'refreshers.row.openJobs',
    reminded: 'refreshers.row.reminded',
  },
  detail: {
    ends: 'refreshers.detail.ends',
    eligibleUntil: 'refreshers.detail.eligibleUntil',
    cadence: 'refreshers.detail.cadence',
    openJobs: 'refreshers.detail.openJobs',
    lastReminder: 'refreshers.detail.lastReminder',
    never: 'refreshers.detail.never',
    extensions: 'refreshers.detail.extensions',
    extensionRow: 'refreshers.detail.extensionRow',
    blockedBody: 'refreshers.detail.blockedBody',
    graceBody: 'refreshers.detail.graceBody',
    extendedBody: 'refreshers.detail.extendedBody',
    dueBody: 'refreshers.detail.dueBody',
    upcomingBody: 'refreshers.detail.upcomingBody',
    remind: 'refreshers.detail.remind',
    reminded: 'refreshers.detail.reminded',
    extend: 'refreshers.detail.extend',
    partner: 'refreshers.detail.partner',
  },
  extend: {
    title: 'refreshers.extend.title',
    body: 'refreshers.extend.body',
    until: 'refreshers.extend.until',
    untilHint: 'refreshers.extend.untilHint',
    reason: 'refreshers.extend.reason',
    reasonHint: 'refreshers.extend.reasonHint',
    confirm: 'refreshers.extend.confirm',
    cancel: 'refreshers.extend.cancel',
    done: 'refreshers.extend.done',
  },
  self: {
    start: 'refreshers.self.start',
    lessons: 'refreshers.self.lessons',
    graceLeft: 'refreshers.self.graceLeft',
    blockedLeft: 'refreshers.self.blockedLeft',
    keepsWorking: 'refreshers.self.keepsWorking',
    intro: 'refreshers.self.intro',
    mine: 'refreshers.self.mine',
  },
  cadence: {
    intro: 'refreshers.cadence.intro',
    placeholder: 'refreshers.cadence.placeholder',
    months: 'refreshers.cadence.months',
    noExpiry: 'refreshers.cadence.noExpiry',
    grace: 'refreshers.cadence.grace',
    inForce: 'refreshers.cadence.inForce',
    upcoming: 'refreshers.cadence.upcoming',
    versions: 'refreshers.cadence.versions',
    versionRow: 'refreshers.cadence.versionRow',
    held: 'refreshers.cadence.held',
    change: 'refreshers.cadence.change',
    changeTitle: 'refreshers.cadence.changeTitle',
    changeBody: 'refreshers.cadence.changeBody',
    monthsField: 'refreshers.cadence.monthsField',
    monthsHint: 'refreshers.cadence.monthsHint',
    graceField: 'refreshers.cadence.graceField',
    graceHint: 'refreshers.cadence.graceHint',
    effective: 'refreshers.cadence.effective',
    effectiveHint: 'refreshers.cadence.effectiveHint',
    reason: 'refreshers.cadence.reason',
    reasonHint: 'refreshers.cadence.reasonHint',
    publish: 'refreshers.cadence.publish',
    cancel: 'refreshers.cadence.cancel',
    published: 'refreshers.cadence.published',
    keepsDates: 'refreshers.cadence.keepsDates',
    safetyNote: 'refreshers.cadence.safetyNote',
  },
  close: 'refreshers.close',
  problem: rec('refreshers.problem', PROBLEMS),
} as const;
