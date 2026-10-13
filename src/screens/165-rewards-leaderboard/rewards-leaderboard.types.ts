import { CLOSING_POLL_MS, CORRECTION_NOTE_DAYS, CLOSING_SOON, LIVE_POLL_MS, METRICS, SHOWN_TOP, timeLeft } from '@/features/rewards/standings';
import type { ContestMetric, ContestPhase } from '@/features/rewards/standings';

export { CLOSING_POLL_MS, CORRECTION_NOTE_DAYS, CLOSING_SOON, LIVE_POLL_MS, METRICS, SHOWN_TOP, timeLeft };
export type { ContestMetric, ContestPhase };
export const PULL_DISTANCE = 70;
export const rewardsLeaderboardPath = (contestId?: string) => (contestId ? `/rewards-leaderboard?contest=${contestId}` : '/rewards-leaderboard');

export const LEADERBOARD_KEYS = {
  title: 'rewardsLeaderboard.title',
  subtitle: 'rewardsLeaderboard.subtitle',
  subtitleAdmin: 'rewardsLeaderboard.subtitleAdmin',
  loading: 'rewardsLeaderboard.loading',
  error: {
    title: 'rewardsLeaderboard.error.title',
    body: 'rewardsLeaderboard.error.body',
  },
  refresh: {
    button: 'rewardsLeaderboard.refresh.button',
    pull: 'rewardsLeaderboard.refresh.pull',
    release: 'rewardsLeaderboard.refresh.release',
    busy: 'rewardsLeaderboard.refresh.busy',
  },
  close: 'rewardsLeaderboard.close',
  link: {
    open: 'rewardsLeaderboard.link.open',
  },
  live: {
    label: 'rewardsLeaderboard.live.label',
    updated: 'rewardsLeaderboard.live.updated',
    justNow: 'rewardsLeaderboard.live.justNow',
    seconds: 'rewardsLeaderboard.live.seconds',
    hours: 'rewardsLeaderboard.live.hours',
    minutes: 'rewardsLeaderboard.live.minutes',
    stale: 'rewardsLeaderboard.live.stale',
  },
  pick: {
    heading: 'rewardsLeaderboard.pick.heading',
  },
  phase: {
    active: 'rewardsLeaderboard.phase.active',
    scheduled: 'rewardsLeaderboard.phase.scheduled',
    closed: 'rewardsLeaderboard.phase.closed',
    ended_early: 'rewardsLeaderboard.phase.ended_early',
  },
  cohort: {
    surveyor: 'rewardsLeaderboard.cohort.surveyor',
    technician: 'rewardsLeaderboard.cohort.technician',
  },
  metric: {
    leadsCaptured: 'rewardsLeaderboard.metric.leadsCaptured',
    leadsConverted: 'rewardsLeaderboard.metric.leadsConverted',
    revenue: 'rewardsLeaderboard.metric.revenue',
    jobsCompleted: 'rewardsLeaderboard.metric.jobsCompleted',
  },
  value: {
    leadsCaptured: 'rewardsLeaderboard.value.leadsCaptured',
    leadsConverted: 'rewardsLeaderboard.value.leadsConverted',
    jobsCompleted: 'rewardsLeaderboard.value.jobsCompleted',
  },
  need: {
    leadsCaptured: 'rewardsLeaderboard.need.leadsCaptured',
    leadsConverted: 'rewardsLeaderboard.need.leadsConverted',
    jobsCompleted: 'rewardsLeaderboard.need.jobsCompleted',
    revenue: 'rewardsLeaderboard.need.revenue',
  },
  hero: {
    timeLeft: {
      days: 'rewardsLeaderboard.hero.timeLeft.days',
      hours: 'rewardsLeaderboard.hero.timeLeft.hours',
      minutes: 'rewardsLeaderboard.hero.timeLeft.minutes',
    },
    ended: 'rewardsLeaderboard.hero.ended',
    starts: 'rewardsLeaderboard.hero.starts',
    closingSoon: 'rewardsLeaderboard.hero.closingSoon',
    endedEarly: 'rewardsLeaderboard.hero.endedEarly',
    frozen: 'rewardsLeaderboard.hero.frozen',
    scheduledBody: 'rewardsLeaderboard.hero.scheduledBody',
  },
  stake: {
    heading: 'rewardsLeaderboard.stake.heading',
    place: 'rewardsLeaderboard.stake.place',
    cash: 'rewardsLeaderboard.stake.cash',
    yours: 'rewardsLeaderboard.stake.yours',
    note: 'rewardsLeaderboard.stake.note',
    none: 'rewardsLeaderboard.stake.none',
  },
  me: {
    heading: 'rewardsLeaderboard.me.heading',
    rank: 'rewardsLeaderboard.me.rank',
    of: 'rewardsLeaderboard.me.of',
    leading: 'rewardsLeaderboard.me.leading',
    inPrize: 'rewardsLeaderboard.me.inPrize',
    paused: 'rewardsLeaderboard.me.paused',
    notIn: 'rewardsLeaderboard.me.notIn',
    passHeading: 'rewardsLeaderboard.me.passHeading',
    pass: 'rewardsLeaderboard.me.pass',
    gap: 'rewardsLeaderboard.me.gap',
    prize: 'rewardsLeaderboard.me.prize',
    tied: 'rewardsLeaderboard.me.tied',
    progress: 'rewardsLeaderboard.me.progress',
  },
  board: {
    heading: 'rewardsLeaderboard.board.heading',
    you: 'rewardsLeaderboard.board.you',
    tied: 'rewardsLeaderboard.board.tied',
    corrected: 'rewardsLeaderboard.board.corrected',
    showAll: 'rewardsLeaderboard.board.showAll',
    showTop: 'rewardsLeaderboard.board.showTop',
    between: 'rewardsLeaderboard.board.between',
    empty: 'rewardsLeaderboard.board.empty',
    reward: 'rewardsLeaderboard.board.reward',
  },
  changes: {
    heading: 'rewardsLeaderboard.changes.heading',
    note: 'rewardsLeaderboard.changes.note',
    none: 'rewardsLeaderboard.changes.none',
    value: {
      up: 'rewardsLeaderboard.changes.value.up',
      correction: 'rewardsLeaderboard.changes.value.correction',
    },
    rank: {
      up: 'rewardsLeaderboard.changes.rank.up',
      down: 'rewardsLeaderboard.changes.rank.down',
      correction: 'rewardsLeaderboard.changes.rank.correction',
    },
    admin: {
      value: 'rewardsLeaderboard.changes.admin.value',
      rank: 'rewardsLeaderboard.changes.admin.rank',
      correction: 'rewardsLeaderboard.changes.admin.correction',
    },
  },
  rules: {
    heading: 'rewardsLeaderboard.rules.heading',
    window: 'rewardsLeaderboard.rules.window',
    leadsCaptured: 'rewardsLeaderboard.rules.leadsCaptured',
    leadsConverted: 'rewardsLeaderboard.rules.leadsConverted',
    revenue: 'rewardsLeaderboard.rules.revenue',
    jobsCompleted: 'rewardsLeaderboard.rules.jobsCompleted',
    tiebreak: 'rewardsLeaderboard.rules.tiebreak',
    same: 'rewardsLeaderboard.rules.same',
    excluded: 'rewardsLeaderboard.rules.excluded',
  },
  none: {
    title: 'rewardsLeaderboard.none.title',
    body: 'rewardsLeaderboard.none.body',
    next: 'rewardsLeaderboard.none.next',
    last: 'rewardsLeaderboard.none.last',
  },
  admin: {
    note: 'rewardsLeaderboard.admin.note',
    leaderboard: 'rewardsLeaderboard.admin.leaderboard',
  },
  placeholder: 'rewardsLeaderboard.placeholder',
  problem: {
    not_found: 'rewardsLeaderboard.problem.not_found',
    forbidden: 'rewardsLeaderboard.problem.forbidden',
  },
} as const;
