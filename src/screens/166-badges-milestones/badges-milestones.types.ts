import { NEW_DAYS, NEXT_SHOWN, RARITY_BANDS, RARITY_MIN_BASE, isPrestige } from '@/features/rewards/badges';
import type { BadgeCategory, BadgeIcon, BadgeMetric, RarityTier } from '@/features/rewards/badges';

export { NEW_DAYS, NEXT_SHOWN, RARITY_BANDS, RARITY_MIN_BASE, isPrestige };
export type { BadgeCategory, BadgeIcon, BadgeMetric, RarityTier };
export const PULL_DISTANCE = 70;
export const CATEGORY_FILTERS = ['all', 'performance', 'training', 'tenure'] as const;
export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];
export const badgesPath = (id?: string) => (id ? `/badges?badge=${encodeURIComponent(id)}` : '/badges');

export const BADGES_KEYS = {
  title: 'badges.title',
  subtitle: 'badges.subtitle',
  loading: 'badges.loading',
  error: {
    title: 'badges.error.title',
    body: 'badges.error.body',
  },
  refresh: {
    button: 'badges.refresh.button',
    pull: 'badges.refresh.pull',
    release: 'badges.refresh.release',
    busy: 'badges.refresh.busy',
  },
  close: 'badges.close',
  link: {
    open: 'badges.link.open',
  },
  hero: {
    total: 'badges.hero.total',
    new: 'badges.hero.new',
    rarest: 'badges.hero.rarest',
    byCategory: 'badges.hero.byCategory',
  },
  cat: {
    all: 'badges.cat.all',
    performance: 'badges.cat.performance',
    training: 'badges.cat.training',
    tenure: 'badges.cat.tenure',
  },
  earnedHeading: 'badges.earnedHeading',
  noneInCategory: 'badges.noneInCategory',
  card: {
    earned: 'badges.card.earned',
    new: 'badges.card.new',
    earlier: 'badges.card.earlier',
    prestige: 'badges.card.prestige',
    rarity: {
      common: 'badges.card.rarity.common',
      uncommon: 'badges.card.rarity.uncommon',
      rare: 'badges.card.rarity.rare',
      epic: 'badges.card.rarity.epic',
      count: 'badges.card.rarity.count',
      small: 'badges.card.rarity.small',
    },
    cert: {
      valid: 'badges.card.cert.valid',
      expiring: 'badges.card.cert.expiring',
      grace: 'badges.card.cert.grace',
      expired: 'badges.card.cert.expired',
      superseded: 'badges.card.cert.superseded',
      retired: 'badges.card.cert.retired',
    },
  },
  badge: {
    lead_first: {
      name: 'badges.badge.lead_first.name',
      desc: 'badges.badge.lead_first.desc',
    },
    leads_5: {
      name: 'badges.badge.leads_5.name',
      desc: 'badges.badge.leads_5.desc',
    },
    leads_10: {
      name: 'badges.badge.leads_10.name',
      desc: 'badges.badge.leads_10.desc',
    },
    deal_first: {
      name: 'badges.badge.deal_first.name',
      desc: 'badges.badge.deal_first.desc',
    },
    deals_5: {
      name: 'badges.badge.deals_5.name',
      desc: 'badges.badge.deals_5.desc',
    },
    revenue_10l: {
      name: 'badges.badge.revenue_10l.name',
      desc: 'badges.badge.revenue_10l.desc',
    },
    revenue_1cr: {
      name: 'badges.badge.revenue_1cr.name',
      desc: 'badges.badge.revenue_1cr.desc',
    },
    job_first: {
      name: 'badges.badge.job_first.name',
      desc: 'badges.badge.job_first.desc',
    },
    jobs_5: {
      name: 'badges.badge.jobs_5.name',
      desc: 'badges.badge.jobs_5.desc',
    },
    jobs_10: {
      name: 'badges.badge.jobs_10.name',
      desc: 'badges.badge.jobs_10.desc',
    },
    contest_winner: {
      name: 'badges.badge.contest_winner.name',
      desc: 'badges.badge.contest_winner.desc',
    },
    tenure_90: {
      name: 'badges.badge.tenure_90.name',
      desc: 'badges.badge.tenure_90.desc',
    },
    tenure_180: {
      name: 'badges.badge.tenure_180.name',
      desc: 'badges.badge.tenure_180.desc',
    },
    tenure_365: {
      name: 'badges.badge.tenure_365.name',
      desc: 'badges.badge.tenure_365.desc',
    },
    tenure_730: {
      name: 'badges.badge.tenure_730.name',
      desc: 'badges.badge.tenure_730.desc',
    },
  },
  criteria: {
    leadsCaptured: 'badges.criteria.leadsCaptured',
    leadsConverted: 'badges.criteria.leadsConverted',
    revenue: 'badges.criteria.revenue',
    jobsCompleted: 'badges.criteria.jobsCompleted',
    tenureDays: 'badges.criteria.tenureDays',
    contestWins: 'badges.criteria.contestWins',
    cert: 'badges.criteria.cert',
  },
  detail: {
    title: 'badges.detail.title',
    how: 'badges.detail.how',
    earnedUnder: 'badges.detail.earnedUnder',
    nowAsks: 'badges.detail.nowAsks',
    honoured: 'badges.detail.honoured',
    rarityHeading: 'badges.detail.rarityHeading',
    rarityNote: 'badges.detail.rarityNote',
    cert: {
      code: 'badges.detail.cert.code',
      note: 'badges.detail.cert.note',
      open: 'badges.detail.cert.open',
    },
    metric: 'badges.detail.metric',
  },
  next: {
    heading: 'badges.next.heading',
    body: 'badges.next.body',
    firstHeading: 'badges.next.firstHeading',
    firstBody: 'badges.next.firstBody',
    of: 'badges.next.of',
    left: {
      leadsCaptured: 'badges.next.left.leadsCaptured',
      leadsConverted: 'badges.next.left.leadsConverted',
      revenue: 'badges.next.left.revenue',
      jobsCompleted: 'badges.next.left.jobsCompleted',
      tenureDays: 'badges.next.left.tenureDays',
      contestWins: 'badges.next.left.contestWins',
    },
    lessons: 'badges.next.lessons',
    test: 'badges.next.test',
    open: 'badges.next.open',
    contest: 'badges.next.contest',
    none: 'badges.next.none',
  },
  empty: {
    title: 'badges.empty.title',
    body: 'badges.empty.body',
  },
  share: {
    button: 'badges.share.button',
    title: 'badges.share.title',
    body: 'badges.share.body',
    download: 'badges.share.download',
    copy: 'badges.share.copy',
    native: 'badges.share.native',
    copied: 'badges.share.copied',
    none: 'badges.share.none',
    downloaded: 'badges.share.downloaded',
    pageHeading: 'badges.share.pageHeading',
    holder: 'badges.share.holder',
    earnedOn: 'badges.share.earnedOn',
    footer: 'badges.share.footer',
    select: 'badges.share.select',
  },
  placeholder: 'badges.placeholder',
  problem: {
    forbidden: 'badges.problem.forbidden',
  },
} as const;
