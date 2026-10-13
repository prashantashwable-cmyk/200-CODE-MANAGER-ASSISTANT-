/** Screen 147 — New Partner Aggregation Dashboard. Types and translation keys only. */

import { FUNNEL, NOW_STAGES, PERIODS, WAITLIST_MIN } from '@/features/recruitment/dashboard';
import type { Period } from '@/features/recruitment/dashboard';

export const POLL_MS = 60_000;
export const PULL_DISTANCE = 70;
export const DEFAULT_PERIOD: Period = 30;
export const periodKey = (p: Period) => (p === 0 ? 'all' : `d${p}`);
export const SIGNAL_TONE = { urgent_low_interest: 'warning', urgent: 'accent', full: 'emerald', balanced: 'muted' } as const;
export { FUNNEL, NOW_STAGES, PERIODS, WAITLIST_MIN };

const rec = <T extends string | number>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const PROBLEMS = ['not_approved', 'reason_required', 'already_sent', 'already_signed', 'not_open', 'not_admin', 'not_found', 'forbidden', 'offline', 'generic'] as const;

export const DASHBOARD_KEYS = {
  title: 'recruitDash.title',
  subtitle: 'recruitDash.subtitle',
  loading: 'recruitDash.loading',
  error: { title: 'recruitDash.error.title', body: 'recruitDash.error.body' },
  period: { label: 'recruitDash.period.label', ...rec('recruitDash.period', ['d30', 'd90', 'all'] as const) },
  refresh: { button: 'recruitDash.refresh.button', pull: 'recruitDash.refresh.pull', release: 'recruitDash.refresh.release', busy: 'recruitDash.refresh.busy' },
  kpi: {
    tta: 'recruitDash.kpi.tta',
    ttaUnit: 'recruitDash.kpi.ttaUnit',
    ttaCaption: 'recruitDash.kpi.ttaCaption',
    ttaFull: 'recruitDash.kpi.ttaFull',
    notEnough: 'recruitDash.kpi.notEnough',
    waiting: 'recruitDash.kpi.waiting',
    waitingCaption: 'recruitDash.kpi.waitingCaption',
    interested: 'recruitDash.kpi.interested',
    applied: 'recruitDash.kpi.applied',
    activated: 'recruitDash.kpi.activated',
    approval: 'recruitDash.kpi.approval',
    approvalCaption: 'recruitDash.kpi.approvalCaption',
    trendCaption: 'recruitDash.kpi.trendCaption',
  },
  funnel: {
    heading: 'recruitDash.funnel.heading',
    hint: 'recruitDash.funnel.hint',
    stage: rec('recruitDash.funnel.stage', FUNNEL),
    carried: 'recruitDash.funnel.carried',
    smallSample: 'recruitDash.funnel.smallSample',
    avgDays: 'recruitDash.funnel.avgDays',
    flagged: 'recruitDash.funnel.flagged',
    flaggedBody: 'recruitDash.funnel.flaggedBody',
    exits: 'recruitDash.funnel.exits',
    empty: 'recruitDash.funnel.empty',
  },
  now: { heading: 'recruitDash.now.heading', hint: 'recruitDash.now.hint', stage: rec('recruitDash.now.stage', NOW_STAGES) },
  territory: {
    heading: 'recruitDash.territory.heading',
    body: 'recruitDash.territory.body',
    mapLabel: 'recruitDash.territory.mapLabel',
    leads: 'recruitDash.territory.leads',
    need: 'recruitDash.territory.need',
    pipeline: 'recruitDash.territory.pipeline',
    room: 'recruitDash.territory.room',
    noRoom: 'recruitDash.territory.noRoom',
    push: 'recruitDash.territory.push',
    signal: rec('recruitDash.territory.signal', ['urgent_low_interest', 'urgent', 'full', 'balanced'] as const),
    open: 'recruitDash.territory.open',
    empty: 'recruitDash.territory.empty',
    placeholder: 'recruitDash.territory.placeholder',
  },
  waitlist: {
    heading: 'recruitDash.waitlist.heading',
    body: 'recruitDash.waitlist.body',
    suggestHeading: 'recruitDash.waitlist.suggestHeading',
    suggestBody: 'recruitDash.waitlist.suggestBody',
    add: 'recruitDash.waitlist.add',
    sheetHeading: 'recruitDash.waitlist.sheetHeading',
    sheetBody: 'recruitDash.waitlist.sheetBody',
    reason: 'recruitDash.waitlist.reason',
    reasonHint: 'recruitDash.waitlist.reasonHint',
    confirm: 'recruitDash.waitlist.confirm',
    release: 'recruitDash.waitlist.release',
    released: 'recruitDash.waitlist.released',
    added: 'recruitDash.waitlist.added',
    since: 'recruitDash.waitlist.since',
    empty: 'recruitDash.waitlist.empty',
    openOffer: 'recruitDash.waitlist.openOffer',
    back: 'recruitDash.waitlist.back',
  },
  channels: { heading: 'recruitDash.channels.heading', hint: 'recruitDash.channels.hint', row: 'recruitDash.channels.row', empty: 'recruitDash.channels.empty' },
  drill: { reach: 'recruitDash.drill.reach', now: 'recruitDash.drill.now', empty: 'recruitDash.drill.empty', since: 'recruitDash.drill.since', openStage: 'recruitDash.drill.openStage', noScreen: 'recruitDash.drill.noScreen', more: 'recruitDash.drill.more' },
  message: { waitlisted: 'recruitDash.message.waitlisted' },
  problem: rec('recruitDash.problem', PROBLEMS),
} as const;
