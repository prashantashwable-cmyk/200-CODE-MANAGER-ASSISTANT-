/**
 * The escalation matrix (184): who is told, in what order and after what delay, when something nobody has acknowledged or resolved is left standing. Pure: the screen, the heartbeat
 * and the drill read the same rules, so what Admin sees configured is exactly what runs. Every number here is a placeholder business decision flagged on the screen.
 */
import { isIndianMobile } from '@/features/validation/india';
import type { Alert } from '@/data/types';

export const ESC_CHANNELS = ['inApp', 'sms', 'call'] as const;
export type EscChannel = (typeof ESC_CHANNELS)[number];
/** Where a message can go: the Admin themself, or one of a few named backup people (slots are positions, so a default chain can name "the first backup" before there is one). */
export const PRIMARY = 'primary';
export const MAX_BACKUPS = 3;
export const backupKey = (n: number): string => `backup:${n}`;
export const BACKUP_KEYS: string[] = Array.from({ length: MAX_BACKUPS }, (_v, i) => backupKey(i + 1));
export const TARGET_KEYS: string[] = [PRIMARY, ...BACKUP_KEYS];
export const isBackupKey = (k: string): boolean => BACKUP_KEYS.includes(k);

export type Trigger = 'unacknowledged' | 'unresolved';
export type RailState = 'working' | 'failing' | 'silent';

export interface EscTier { id: string; targets: string[]; channels: EscChannel[]; afterMinutes: number }
export interface EscLastResort { repeatEveryMinutes: number; repeats: number }

export const MAX_TIERS = 6;
export const MAX_DELAY_MINUTES = 1440;
export const MAX_REPEATS = 6;
export const NOTE_MIN = 20;

export type ScenarioId = 'sos' | 'safety' | 'payout_failure' | 'critical_exception' | 'high_exception';
export interface ScenarioDef {
  id: ScenarioId;
  /** Critical to life or to the business: its chain must not depend on one person. */
  vital: boolean;
  trigger: Trigger;
  /** The alerts it covers, most specific first (see `scenarioIdOf`). */
  match: { titleKeys?: string[]; titlePrefix?: string; category?: Alert['category']; severities?: Alert['severity'][] };
  tiers: Omit<EscTier, 'id'>[];
  lastResort: EscLastResort;
  /** How often a drill is owed (placeholder). */
  drillEveryDays: number;
}

export const SOS_TITLES = ['alerts.type.fieldSos', 'serviceTickets.alert.emergency'];
export const EXHAUSTED_TITLE = 'escalationMatrix.alert.exhausted';
export const DRILL_GAP_TITLE = 'escalationMatrix.alert.drillGap';

/** Defaults (placeholders for the owner to confirm). Backups are named by slot: until a person is set, the chain says plainly that it has a gap. */
export const SCENARIOS: ScenarioDef[] = [
  {
    id: 'sos', vital: true, trigger: 'unacknowledged', drillEveryDays: 30,
    match: { titleKeys: SOS_TITLES },
    tiers: [
      { targets: [PRIMARY], channels: ['inApp', 'sms', 'call'], afterMinutes: 0 },
      { targets: [backupKey(1)], channels: ['sms', 'call'], afterMinutes: 5 },
      { targets: [backupKey(2)], channels: ['sms', 'call'], afterMinutes: 5 },
    ],
    lastResort: { repeatEveryMinutes: 10, repeats: 3 },
  },
  {
    id: 'safety', vital: true, trigger: 'unacknowledged', drillEveryDays: 30,
    match: { category: 'safety', severities: ['critical', 'high'] },
    tiers: [
      { targets: [PRIMARY], channels: ['inApp', 'sms'], afterMinutes: 0 },
      { targets: [PRIMARY], channels: ['call'], afterMinutes: 10 },
      { targets: [backupKey(1)], channels: ['sms', 'call'], afterMinutes: 10 },
      { targets: [backupKey(2)], channels: ['sms', 'call'], afterMinutes: 20 },
    ],
    lastResort: { repeatEveryMinutes: 15, repeats: 2 },
  },
  {
    id: 'payout_failure', vital: false, trigger: 'unacknowledged', drillEveryDays: 90,
    match: { titlePrefix: 'payoutDisbursement.alert.' },
    tiers: [
      { targets: [PRIMARY], channels: ['inApp'], afterMinutes: 0 },
      { targets: [PRIMARY], channels: ['sms'], afterMinutes: 240 },
      { targets: [backupKey(1)], channels: ['sms'], afterMinutes: 720 },
    ],
    lastResort: { repeatEveryMinutes: 720, repeats: 1 },
  },
  {
    id: 'critical_exception', vital: true, trigger: 'unresolved', drillEveryDays: 60,
    match: { severities: ['critical'] },
    tiers: [
      { targets: [PRIMARY], channels: ['inApp', 'sms'], afterMinutes: 0 },
      { targets: [PRIMARY], channels: ['call'], afterMinutes: 30 },
      { targets: [backupKey(1)], channels: ['sms', 'call'], afterMinutes: 60 },
      { targets: [backupKey(2)], channels: ['sms', 'call'], afterMinutes: 60 },
    ],
    lastResort: { repeatEveryMinutes: 120, repeats: 2 },
  },
  {
    id: 'high_exception', vital: false, trigger: 'unacknowledged', drillEveryDays: 90,
    match: { severities: ['high'] },
    tiers: [
      { targets: [PRIMARY], channels: ['inApp'], afterMinutes: 0 },
      { targets: [PRIMARY], channels: ['sms'], afterMinutes: 60 },
      { targets: [backupKey(1)], channels: ['sms'], afterMinutes: 180 },
    ],
    lastResort: { repeatEveryMinutes: 360, repeats: 1 },
  },
];
/** Plain English names, for the places that print one as text (a commitment title); the screen translates its own labels. */
export const SCENARIO_NAMES: Record<ScenarioId, string> = { sos: 'Emergency (SOS)', safety: 'Safety concern', payout_failure: 'Payout failure', critical_exception: 'Critical exception', high_exception: 'High-priority exception' };
export const scenarioDef = (id: string): ScenarioDef | undefined => SCENARIOS.find((s) => s.id === id);
export const withTierIds = (tiers: Omit<EscTier, 'id'>[]): EscTier[] => tiers.map((t, i) => ({ ...t, id: `t${i + 1}` }));

/** The one scenario an alert belongs to: the most specific that matches. An escalation's own alerts are never escalated again by themselves. */
export function scenarioIdOf(alert: Pick<Alert, 'titleKey' | 'category' | 'severity'>): ScenarioId | null {
  if (alert.titleKey === EXHAUSTED_TITLE) return null;
  for (const s of SCENARIOS) {
    const m = s.match;
    if (m.titleKeys && !m.titleKeys.includes(alert.titleKey)) continue;
    if (m.titlePrefix && !alert.titleKey.startsWith(m.titlePrefix)) continue;
    if (m.category && alert.category !== m.category) continue;
    if (m.severities && !m.severities.includes(alert.severity)) continue;
    if (!m.titleKeys && !m.titlePrefix && !m.category && !m.severities) continue;
    return s.id;
  }
  return null;
}

/** Minutes after the alert was raised at which each tier fires, then each repeat of the last tier. */
export function offsetsOf(tiers: Pick<EscTier, 'afterMinutes'>[]): number[] {
  let sum = 0;
  return tiers.map((t) => (sum += t.afterMinutes));
}
export function repeatOffsets(tiers: Pick<EscTier, 'afterMinutes'>[], last: EscLastResort): number[] {
  const base = offsetsOf(tiers);
  const end = base[base.length - 1] ?? 0;
  return Array.from({ length: Math.max(0, last.repeats) }, (_v, i) => end + (i + 1) * Math.max(1, last.repeatEveryMinutes));
}
/** When the chain runs out of people: after the last repeat. */
export const exhaustedAfterMinutes = (tiers: Pick<EscTier, 'afterMinutes'>[], last: EscLastResort): number => {
  const rep = repeatOffsets(tiers, last);
  return rep[rep.length - 1] ?? offsetsOf(tiers)[tiers.length - 1] ?? 0;
};
export const formatMinutes = (m: number): { value: number; unit: 'min' | 'h' | 'd' } => (m >= 1440 && m % 1440 === 0 ? { value: m / 1440, unit: 'd' } : m >= 60 && m % 60 === 0 ? { value: m / 60, unit: 'h' } : { value: m, unit: 'min' });

export type ChainProblem =
  | 'no_tiers' | 'too_many_tiers' | 'tier_no_target' | 'tier_no_channel' | 'bad_delay' | 'first_delay' | 'unknown_target' | 'bad_repeat' | 'single_person' | 'note_short';
export interface ContactLite { name: string; phone: string }

/** What stops a chain from being saved (blocking) and what it should be told about (warnings). `contacts` is the slot list (null = nobody set yet). */
export function chainProblems(input: { tiers: EscTier[]; lastResort: EscLastResort; vital: boolean; singlePointNote?: string }): { blocking: ChainProblem[]; warn: ChainProblem[] } {
  const blocking: ChainProblem[] = [];
  const warn: ChainProblem[] = [];
  const { tiers } = input;
  if (tiers.length === 0) blocking.push('no_tiers');
  if (tiers.length > MAX_TIERS) blocking.push('too_many_tiers');
  tiers.forEach((t, i) => {
    if (t.targets.length === 0) blocking.push('tier_no_target');
    if (t.targets.some((k) => !TARGET_KEYS.includes(k))) blocking.push('unknown_target');
    if (t.channels.length === 0) blocking.push('tier_no_channel');
    if (!Number.isInteger(t.afterMinutes) || t.afterMinutes < 0 || t.afterMinutes > MAX_DELAY_MINUTES) blocking.push('bad_delay');
    else if (i > 0 && t.afterMinutes < 1) blocking.push('bad_delay');
    if (i === 0 && t.afterMinutes !== 0) blocking.push('first_delay');
  });
  const l = input.lastResort;
  if (!Number.isInteger(l.repeats) || l.repeats < 0 || l.repeats > MAX_REPEATS || !Number.isInteger(l.repeatEveryMinutes) || l.repeatEveryMinutes < 1 || l.repeatEveryMinutes > MAX_DELAY_MINUTES) blocking.push('bad_repeat');
  const people = new Set(tiers.flatMap((t) => t.targets));
  // A vital chain that only ever reaches the Admin has no fallback: allowed only as a documented, deliberate choice.
  if (people.size <= 1 && people.has(PRIMARY) && tiers.length > 0) {
    if (input.vital) (input.singlePointNote ?? '').trim().length >= NOTE_MIN ? warn.push('single_person') : blocking.push('single_person');
    else warn.push('single_person');
  }
  return { blocking: [...new Set(blocking)], warn: [...new Set(warn)] };
}

export type GapKind = 'unfilled' | 'no_phone' | 'no_account' | 'failed' | 'no_response';
export interface DrillStepLite { tierIndex: number; target: string; channel: EscChannel }
/** Every (tier, person, channel) a drill must prove. */
export function drillStepsOf(tiers: EscTier[]): DrillStepLite[] {
  return tiers.flatMap((t, tierIndex) => t.targets.flatMap((target) => t.channels.map((channel) => ({ tierIndex, target, channel }))));
}

/** The demo rail answers per person and channel: a working one confirms, a failing one is refused at once, a silent one is accepted and never confirmed (the quiet failure a drill exists to catch). */
export const DEMO_CONFIRM_MS = 20_000;
export const DEMO_SILENCE_MS = 90_000;
export const railOutcome = (rail: RailState): 'confirms' | 'fails' | 'silent' => (rail === 'working' ? 'confirms' : rail === 'failing' ? 'fails' : 'silent');

/** Is a drill owed? (days since the last drill, or since the matrix was first set up when there never was one.) */
export const drillDueAt = (lastDrillAt: string | null, configuredAt: string, everyDays: number): string => new Date(Date.parse(lastDrillAt ?? configuredAt) + everyDays * 86_400_000).toISOString();

/** A phone number that can be rung or texted: 10 digits, optionally with a country code. */
export const phoneProblem = (p: string): boolean => !isIndianMobile(p);
export const maskPhone = (p: string): string => { const d = p.replace(/\D/g, ''); return d.length >= 4 ? `••••••${d.slice(-4)}` : '••••'; };
