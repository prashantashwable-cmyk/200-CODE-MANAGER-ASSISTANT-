/**
 * The badge catalogue and its rules, pure (166). A badge is recognition for something real a partner did, and it is honest in three ways: the criteria are versioned
 * (a badge already earned is honoured under the rules of its day and never taken back when the bar is raised), progress is read from live numbers, and rarity is worked out
 * from how many partners actually hold it, today. Nothing here is stored.
 *
 * Training certifications are not in this catalogue: they come from the training records (154/155) and are shown beside these in one collection. The thresholds, dates and
 * rarity bands below are placeholder business decisions, flagged to the owner on screen.
 */
import { days } from '@/features/sla/clock';

export const CATEGORIES = ['performance', 'training', 'tenure'] as const;
export type BadgeCategory = (typeof CATEGORIES)[number];

/** What a catalogue badge counts. `tenureDays` is days since joining; `contestWins` is first places in finished contests (165). */
export type BadgeMetric = 'leadsCaptured' | 'leadsConverted' | 'revenue' | 'jobsCompleted' | 'tenureDays' | 'contestWins';
export type BadgeRole = 'surveyor' | 'technician';
export type BadgeIcon = 'flag' | 'target' | 'handshake' | 'currency' | 'wrench' | 'trophy' | 'hourglass' | 'seal';

export interface CriteriaVersion { version: number; effectiveFrom: string; threshold: number }
export interface BadgeDef {
  id: string;
  category: Exclude<BadgeCategory, 'training'>;
  metric: BadgeMetric;
  roles: BadgeRole[];
  icon: BadgeIcon;
  /** Several of a kind: shown in order so "the next one" is clear. */
  family: string;
  order: number;
  /** Append-only: the latest whose day has arrived applies to anyone not yet holding the badge. */
  versions: CriteriaVersion[];
}

const daysBack = (n: number): string => new Date(Date.now() - days(n)).toISOString();
const SINCE_START = '2025-01-01T00:00:00.000Z';
const BOTH: BadgeRole[] = ['surveyor', 'technician'];
const one = (threshold: number): CriteriaVersion[] => [{ version: 1, effectiveFrom: SINCE_START, threshold }];

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'lead_first', category: 'performance', metric: 'leadsCaptured', roles: ['surveyor'], icon: 'flag', family: 'leads', order: 1, versions: one(1) },
  // The bar for this one was raised once: whoever had earned it under version 1 keeps it, and says so.
  { id: 'leads_5', category: 'performance', metric: 'leadsCaptured', roles: ['surveyor'], icon: 'flag', family: 'leads', order: 2, versions: [{ version: 1, effectiveFrom: daysBack(120), threshold: 4 }, { version: 2, effectiveFrom: daysBack(30), threshold: 5 }] },
  { id: 'leads_10', category: 'performance', metric: 'leadsCaptured', roles: ['surveyor'], icon: 'flag', family: 'leads', order: 3, versions: one(10) },
  { id: 'deal_first', category: 'performance', metric: 'leadsConverted', roles: ['surveyor'], icon: 'handshake', family: 'deals', order: 1, versions: one(1) },
  { id: 'deals_5', category: 'performance', metric: 'leadsConverted', roles: ['surveyor'], icon: 'handshake', family: 'deals', order: 2, versions: one(5) },
  { id: 'revenue_10l', category: 'performance', metric: 'revenue', roles: ['surveyor'], icon: 'currency', family: 'revenue', order: 1, versions: one(1_000_000) },
  { id: 'revenue_1cr', category: 'performance', metric: 'revenue', roles: ['surveyor'], icon: 'currency', family: 'revenue', order: 2, versions: one(10_000_000) },
  { id: 'job_first', category: 'performance', metric: 'jobsCompleted', roles: ['technician'], icon: 'wrench', family: 'jobs', order: 1, versions: one(1) },
  { id: 'jobs_5', category: 'performance', metric: 'jobsCompleted', roles: ['technician'], icon: 'wrench', family: 'jobs', order: 2, versions: one(5) },
  { id: 'jobs_10', category: 'performance', metric: 'jobsCompleted', roles: ['technician'], icon: 'wrench', family: 'jobs', order: 3, versions: one(10) },
  { id: 'contest_winner', category: 'performance', metric: 'contestWins', roles: BOTH, icon: 'trophy', family: 'contest', order: 1, versions: one(1) },
  { id: 'tenure_90', category: 'tenure', metric: 'tenureDays', roles: BOTH, icon: 'hourglass', family: 'tenure', order: 1, versions: one(90) },
  { id: 'tenure_180', category: 'tenure', metric: 'tenureDays', roles: BOTH, icon: 'hourglass', family: 'tenure', order: 2, versions: one(180) },
  { id: 'tenure_365', category: 'tenure', metric: 'tenureDays', roles: BOTH, icon: 'hourglass', family: 'tenure', order: 3, versions: one(365) },
  { id: 'tenure_730', category: 'tenure', metric: 'tenureDays', roles: BOTH, icon: 'hourglass', family: 'tenure', order: 4, versions: one(730) },
];
export const defOf = (id: string): BadgeDef | undefined => BADGE_DEFS.find((d) => d.id === id);

/** The version that applies to someone earning it now: the latest whose day has arrived. */
export const versionInForce = (d: BadgeDef, now: number): CriteriaVersion => [...d.versions].filter((v) => Date.parse(v.effectiveFrom) <= now).sort((a, b) => b.version - a.version)[0] ?? d.versions[0];
export const versionOf = (d: BadgeDef, version: number): CriteriaVersion => d.versions.find((v) => v.version === version) ?? d.versions[0];

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic';
/** Share of eligible partners holding it, and the tier it reads as. Under `RARITY_MIN_BASE` partners the tier is not claimed: it would be a label on a handful of people. */
export const RARITY_MIN_BASE = 4;
export const RARITY_BANDS: { tier: RarityTier; atLeast: number }[] = [{ tier: 'common', atLeast: 50 }, { tier: 'uncommon', atLeast: 25 }, { tier: 'rare', atLeast: 10 }, { tier: 'epic', atLeast: 0 }];
export interface Rarity { tier: RarityTier | null; holders: number; base: number; pct: number }
export function rarityOf(holders: number, base: number): Rarity {
  const pct = base > 0 ? Math.round((holders / base) * 100) : 0;
  const tier = base < RARITY_MIN_BASE ? null : (RARITY_BANDS.find((b) => pct >= b.atLeast)?.tier ?? 'epic');
  return { tier, holders, base, pct };
}
export const isPrestige = (r: Rarity): boolean => r.tier === 'rare' || r.tier === 'epic';

/** A badge a person has not yet earned, with how far they are on today's real numbers. */
export interface Progress { current: number; target: number; pct: number; remaining: number }
export function progressOf(current: number, target: number): Progress {
  return { current, target, pct: target > 0 ? Math.max(0, Math.min(1, current / target)) : 0, remaining: Math.max(0, target - current) };
}

/** How recently earned counts as "new". */
export const NEW_DAYS = 7;
export const isNew = (earnedAt: string, now: number): boolean => now - Date.parse(earnedAt) <= days(NEW_DAYS);
export const NEXT_SHOWN = 4;

/** The date a running total reached a threshold: the record that took it there (never the day anyone happened to look). */
export function crossingDate(events: { at: string; amount: number }[], threshold: number): string | null {
  let sum = 0;
  for (const e of [...events].sort((a, b) => (a.at < b.at ? -1 : 1))) { sum += e.amount; if (sum >= threshold) return e.at; }
  return null;
}
