/** Screen 155 — Certification Badge & Progress. Constants and translation keys only. */

import type { CertBadgeStatus, CertNextStep } from '@/data/repository';

export const STATUSES: CertBadgeStatus[] = ['valid', 'expiring', 'grace', 'expired', 'superseded', 'retired'];
export const BECAUSE: CertNextStep['because'][] = ['blocks_jobs', 'expired', 'expiring', 'required'];
export const KINDS: CertNextStep['kind'][] = ['renew', 'test', 'lessons'];
export const libraryPath = '/training';
export const assessmentPath = (moduleId: string) => `/assessment/${moduleId}`;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const CERT_KEYS = {
  title: 'certifications.title',
  subtitle: 'certifications.subtitle',
  loading: 'certifications.loading',
  error: { title: 'certifications.error.title', body: 'certifications.error.body' },
  empty: { title: 'certifications.empty.title', body: 'certifications.empty.body', action: 'certifications.empty.action' },
  hero: { heading: 'certifications.hero.heading', held: 'certifications.hero.held', progress: 'certifications.hero.progress', allHeld: 'certifications.hero.allHeld', none: 'certifications.hero.none', expiring: 'certifications.hero.expiring', expired: 'certifications.hero.expired', earlier: 'certifications.hero.earlier', role: rec('certifications.hero.role', ['surveyor', 'technician', 'supplier'] as const) },
  next: { heading: 'certifications.next.heading', none: 'certifications.next.none', kind: rec('certifications.next.kind', KINDS), because: rec('certifications.next.because', BECAUSE), go: 'certifications.next.go' },
  badges: { heading: 'certifications.badges.heading', earlier: 'certifications.badges.earlier', earlierHint: 'certifications.badges.earlierHint' },
  status: rec('certifications.status', STATUSES),
  badge: {
    earned: 'certifications.badge.earned',
    validUntil: 'certifications.badge.validUntil',
    daysLeft: 'certifications.badge.daysLeft',
    daysAgo: 'certifications.badge.daysAgo',
    noExpiry: 'certifications.badge.noExpiry',
    version: 'certifications.badge.version',
    score: 'certifications.badge.score',
    code: 'certifications.badge.code',
    gates: 'certifications.badge.gates',
    renewed: 'certifications.badge.renewed',
    earlierStandard: 'certifications.badge.earlierStandard',
    retiredStandard: 'certifications.badge.retiredStandard',
    lapsedNote: 'certifications.badge.lapsedNote',
    graceNote: 'certifications.badge.graceNote',
    refreshers: 'certifications.badge.refreshers',
    expiringNote: 'certifications.badge.expiringNote',
    download: 'certifications.badge.download',
    renew: 'certifications.badge.renew',
    open: 'certifications.badge.open',
    downloaded: 'certifications.badge.downloaded',
  },
  standing: {
    heading: 'certifications.standing.heading',
    body: 'certifications.standing.body',
    you: 'certifications.standing.you',
    anon: 'certifications.standing.anon',
    metric: 'certifications.standing.metric',
    recent: 'certifications.standing.recent',
    yourPlace: 'certifications.standing.yourPlace',
    notEnough: 'certifications.standing.notEnough',
    toggle: 'certifications.standing.toggle',
    toggleHint: 'certifications.standing.toggleHint',
    encouragement: 'certifications.standing.encouragement',
  },
  credential: {
    brand: 'certifications.credential.brand',
    heading: 'certifications.credential.heading',
    holder: 'certifications.credential.holder',
    module: 'certifications.credential.module',
    earned: 'certifications.credential.earned',
    valid: 'certifications.credential.valid',
    version: 'certifications.credential.version',
    score: 'certifications.credential.score',
    code: 'certifications.credential.code',
    footer: 'certifications.credential.footer',
    noExpiry: 'certifications.credential.noExpiry',
  },
  alert: { lapsedOnJob: 'certifications.alert.lapsedOnJob' },
  problem: { generic: 'certifications.problem.generic' },
} as const;
