/** Screen 125 — Technician Live Location Check-In/Check-Out. Types and translation keys only. */

import type { SiteLeaveReason } from '@/data/types';

export type CheckinStatus = 'loading' | 'ready' | 'error' | 'not_found';

/** How often the record is re-read while open, and how often the phone's position is sent to the live map while checked in. */
export const POLL_MS = 20_000;
export const PING_MS = 60_000;
/** Where a check-in or check-out made without signal waits on the phone. Per person. */
export const queueKey = (userId: string) => `aiec.siteQueue.${userId}`;
export const viewKey = (userId: string, jobId: string) => `aiec.siteView.${userId}.${jobId}`;

export const LEAVE_REASONS: SiteLeaveReason[] = ['end_of_day', 'waiting_material', 'site_blocked', 'emergency', 'other'];

/** Refusals that will not change on a retry: reported, not retried. */
export const FINAL_ERRORS = [
  'job_on_hold', 'read_only', 'not_scheduled_yet', 'already_checked_in', 'checked_in_elsewhere', 'reason_required', 'captured_in_future', 'captured_invalid', 'not_checked_in', 'stale_visit',
  'leave_reason_required', 'leave_before_arrival', 'leave_in_future', 'leave_invalid', 'forbidden', 'not_found', 'invalid_state',
] as const;
export type FinalError = (typeof FINAL_ERRORS)[number];

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const jobPath = (id: string) => `/technician/jobs/${id}`;
export const checkinPath = (id: string) => `/technician/jobs/${id}/checkin`;
export const sopPath = (id: string) => `/technician/jobs/${id}/sop`;
export const homePath = '/technician';

export const CHECKIN_KEYS = {
  title: 'siteCheckIn.title',
  loading: 'siteCheckIn.loading',
  back: 'siteCheckIn.back',
  duration: 'siteCheckIn.duration',
  error: { title: 'siteCheckIn.error.title', body: 'siteCheckIn.error.body' },
  notFound: { title: 'siteCheckIn.notFound.title', body: 'siteCheckIn.notFound.body' },
  sync: { offline: 'siteCheckIn.sync.offline', queued: 'siteCheckIn.sync.queued', syncing: 'siteCheckIn.sync.syncing', notSent: 'siteCheckIn.sync.notSent' },
  failed: { title: 'siteCheckIn.failed.title', item: 'siteCheckIn.failed.item', dismiss: 'siteCheckIn.failed.dismiss' },
  problem: {
    job_on_hold: 'siteCheckIn.problem.job_on_hold',
    read_only: 'siteCheckIn.problem.read_only',
    not_scheduled_yet: 'siteCheckIn.problem.not_scheduled_yet',
    checked_in_elsewhere: 'siteCheckIn.problem.checked_in_elsewhere',
    ...rec('siteCheckIn.problem', ['already_checked_in', 'reason_required', 'captured_in_future', 'captured_invalid', 'not_checked_in', 'stale_visit', 'leave_reason_required', 'leave_before_arrival', 'leave_in_future', 'leave_invalid', 'forbidden', 'not_found', 'invalid_state', 'generic'] as const),
  },
  gps: {
    locating: 'siteCheckIn.gps.locating',
    distance: 'siteCheckIn.gps.distance',
    denied: 'siteCheckIn.gps.denied',
    unavailable: 'siteCheckIn.gps.unavailable',
    weak: 'siteCheckIn.gps.weak',
    retry: 'siteCheckIn.gps.retry',
    map: 'siteCheckIn.gps.map',
    you: 'siteCheckIn.gps.you',
    site: 'siteCheckIn.gps.site',
    radius: 'siteCheckIn.gps.radius',
    largeSite: 'siteCheckIn.gps.largeSite',
  },
  verdict: rec('siteCheckIn.verdict', ['clean', 'borderline', 'mismatch', 'unverified', 'waiting'] as const),
  checkIn: {
    heading: 'siteCheckIn.checkIn.heading',
    body: 'siteCheckIn.checkIn.body',
    button: 'siteCheckIn.checkIn.button',
    borderline: 'siteCheckIn.checkIn.borderline',
    reason: 'siteCheckIn.checkIn.reason',
    reasonMismatch: 'siteCheckIn.checkIn.reasonMismatch',
    reasonNoGps: 'siteCheckIn.checkIn.reasonNoGps',
    reasonHint: 'siteCheckIn.checkIn.reasonHint',
    noGpsToggle: 'siteCheckIn.checkIn.noGpsToggle',
    toast: 'siteCheckIn.checkIn.toast',
    toastQueued: 'siteCheckIn.checkIn.toastQueued',
  },
  onSite: { heading: 'siteCheckIn.onSite.heading', since: 'siteCheckIn.onSite.since', today: 'siteCheckIn.onSite.today', distance: 'siteCheckIn.onSite.distance', farNow: 'siteCheckIn.onSite.farNow', live: 'siteCheckIn.onSite.live' },
  checkOut: {
    button: 'siteCheckIn.checkOut.button',
    title: 'siteCheckIn.checkOut.title',
    confirm: 'siteCheckIn.checkOut.confirm',
    confirmOpen: 'siteCheckIn.checkOut.confirmOpen',
    plain: 'siteCheckIn.checkOut.plain',
    openIntro: 'siteCheckIn.checkOut.openIntro',
    openWarn: 'siteCheckIn.checkOut.openWarn',
    why: 'siteCheckIn.checkOut.why',
    noteLabel: 'siteCheckIn.checkOut.noteLabel',
    noteHint: 'siteCheckIn.checkOut.noteHint',
    toChecklist: 'siteCheckIn.checkOut.toChecklist',
    safety: 'siteCheckIn.checkOut.safety',
    toast: 'siteCheckIn.checkOut.toast',
    toastQueued: 'siteCheckIn.checkOut.toastQueued',
    reason: rec('siteCheckIn.checkOut.reason', LEAVE_REASONS),
    reasonHint: rec('siteCheckIn.checkOut.reasonHint', LEAVE_REASONS),
  },
  stale: {
    title: 'siteCheckIn.stale.title',
    body: 'siteCheckIn.stale.body',
    when: 'siteCheckIn.stale.when',
    whenHint: 'siteCheckIn.stale.whenHint',
    note: 'siteCheckIn.stale.note',
    confirm: 'siteCheckIn.stale.confirm',
    toast: 'siteCheckIn.stale.toast',
    tooEarly: 'siteCheckIn.stale.tooEarly',
    inFuture: 'siteCheckIn.stale.inFuture',
  },
  elsewhere: { title: 'siteCheckIn.elsewhere.title', body: 'siteCheckIn.elsewhere.body', action: 'siteCheckIn.elsewhere.action' },
  blocked: { notScheduled: 'siteCheckIn.blocked.notScheduled', onHold: 'siteCheckIn.blocked.onHold', closed: 'siteCheckIn.blocked.closed' },
  team: {
    heading: 'siteCheckIn.team.heading',
    lead: 'siteCheckIn.team.lead',
    assistant: 'siteCheckIn.team.assistant',
    onSite: 'siteCheckIn.team.onSite',
    left: 'siteCheckIn.team.left',
    notYet: 'siteCheckIn.team.notYet',
    total: 'siteCheckIn.team.total',
    unconfirmed: 'siteCheckIn.team.unconfirmed',
    you: 'siteCheckIn.team.you',
  },
  days: {
    heading: 'siteCheckIn.days.heading',
    empty: 'siteCheckIn.days.empty',
    total: 'siteCheckIn.days.total',
    unconfirmed: 'siteCheckIn.days.unconfirmed',
    typical: 'siteCheckIn.days.typical',
    typicalNone: 'siteCheckIn.days.typicalNone',
  },
  visits: {
    heading: 'siteCheckIn.visits.heading',
    empty: 'siteCheckIn.visits.empty',
    inOut: 'siteCheckIn.visits.inOut',
    stillIn: 'siteCheckIn.visits.stillIn',
    drift: 'siteCheckIn.visits.drift',
    lateConfirmed: 'siteCheckIn.visits.lateConfirmed',
    left: 'siteCheckIn.visits.left',
    openSteps: 'siteCheckIn.visits.openSteps',
    reason: 'siteCheckIn.visits.reason',
    forgotten: 'siteCheckIn.visits.forgotten',
    more: 'siteCheckIn.visits.more',
    less: 'siteCheckIn.visits.less',
  },
  alert: { offSite: 'siteCheckIn.alert.offSite', unverified: 'siteCheckIn.alert.unverified', checkoutIncomplete: 'siteCheckIn.alert.checkoutIncomplete' },
} as const;
