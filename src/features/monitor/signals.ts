/**
 * The single-person monitor's signals (193): which things are worth a daily look, how each is judged, what can never be left off the panel, and how a "checked" is recorded honestly.
 * Pure: the repository computes the values from the records each screen already keeps; this module only says what they mean. It aggregates; it does not replace the Admin's own judgement.
 * Every number is a placeholder flagged on the screen.
 */
export type MonitorGroup = 'safety' | 'systems' | 'automation' | 'business' | 'financial' | 'workforce';
export type MonitorStatus = 'ok' | 'watch' | 'act';
export type MonitorUnit = 'count' | 'inr' | 'pct';
export type CheckKind = 'all_fine' | 'with_concerns';

export interface SignalDef {
  id: string;
  group: MonitorGroup;
  unit: MonitorUnit;
  /** Where the full screen for this signal is. */
  route: string;
  /** Always on the panel, whatever set is configured: a safety or integrity signal can never be tucked away. */
  pinned: boolean;
  /** Shown to a backup viewer while the Admin is away: counts only, nothing about a customer or an amount. */
  limited: boolean;
  /** Which way is good, for the arrow: fewer problems is good; more leads and revenue is good. */
  good: 'down' | 'up';
}

export const SIGNALS: SignalDef[] = [
  { id: 'critical_alerts', group: 'safety', unit: 'count', route: '/admin/alerts', pinned: true, limited: true, good: 'down' },
  { id: 'safety', group: 'safety', unit: 'count', route: '/admin/alerts', pinned: true, limited: true, good: 'down' },
  { id: 'emergency_chain', group: 'safety', unit: 'count', route: '/escalation-matrix', pinned: true, limited: true, good: 'down' },
  { id: 'audit_chain', group: 'systems', unit: 'count', route: '/audit-log', pinned: true, limited: true, good: 'down' },
  { id: 'integrations', group: 'systems', unit: 'count', route: '/system-health', pinned: false, limited: true, good: 'down' },
  { id: 'sandbox_prod', group: 'systems', unit: 'count', route: '/integrations', pinned: false, limited: true, good: 'down' },
  { id: 'automation', group: 'automation', unit: 'count', route: '/automation-rules', pinned: false, limited: true, good: 'down' },
  { id: 'sla', group: 'automation', unit: 'count', route: '/sla-monitor', pinned: false, limited: true, good: 'down' },
  { id: 'commitments', group: 'automation', unit: 'count', route: '/admin/analytics/automation', pinned: false, limited: false, good: 'down' },
  { id: 'leads_new', group: 'business', unit: 'count', route: '/admin/leads', pinned: false, limited: false, good: 'up' },
  { id: 'conversion', group: 'business', unit: 'pct', route: '/admin', pinned: false, limited: false, good: 'up' },
  { id: 'quotes_expiring', group: 'business', unit: 'count', route: '/admin/quotes', pinned: false, limited: false, good: 'down' },
  { id: 'revenue_month', group: 'financial', unit: 'inr', route: '/admin', pinned: false, limited: false, good: 'up' },
  { id: 'payments_overdue', group: 'financial', unit: 'inr', route: '/admin/analytics/collections', pinned: false, limited: false, good: 'down' },
  { id: 'supplier_pay', group: 'financial', unit: 'count', route: '/supplier-payments', pinned: false, limited: false, good: 'down' },
  { id: 'payouts', group: 'financial', unit: 'count', route: '/payout-disbursement', pinned: false, limited: false, good: 'down' },
  { id: 'workforce', group: 'workforce', unit: 'count', route: '/training-compliance', pinned: false, limited: false, good: 'down' },
  { id: 'quality', group: 'workforce', unit: 'count', route: '/admin/alerts', pinned: false, limited: false, good: 'down' },
];
export const signalDef = (id: string): SignalDef | undefined => SIGNALS.find((s) => s.id === id);
export const PINNED_IDS: string[] = SIGNALS.filter((s) => s.pinned).map((s) => s.id);
export const GROUPS: MonitorGroup[] = ['safety', 'systems', 'automation', 'business', 'financial', 'workforce'];

/** Starting sets for a business at different stages (placeholders): what to look at first changes as the business matures. */
export const PRESETS: Record<'early' | 'growing' | 'mature', string[]> = {
  early: ['leads_new', 'conversion', 'quotes_expiring', 'payments_overdue', 'commitments'],
  growing: ['leads_new', 'conversion', 'payments_overdue', 'supplier_pay', 'payouts', 'sla', 'commitments', 'workforce'],
  mature: ['sla', 'workforce', 'quality', 'revenue_month', 'payments_overdue', 'payouts', 'automation', 'integrations'],
};
export type PresetId = keyof typeof PRESETS;
export const DEFAULT_PRESET: PresetId = 'growing';

/** Placeholders for the owner to confirm. */
export const MAX_CONFIGURED = 10;
export const NOTE_MIN = 15;
export const CONCERN_DAYS_MAX = 30;
export const ABSENCE_MAX_DAYS = 60;
export const DEFAULT_CHECK_TIME = '10:00';
export const DEFAULT_CHECK_DAYS = [1, 2, 3, 4, 5, 6];
/** An overdue payment this old needs action; younger ones are worth watching. */
export const OVERDUE_ACT_DAYS = 30;
/** A conversion rate below this is worth a look. */
export const CONVERSION_WATCH = 0.15;
/** A quote is "expiring" this close to the end of its validity. */
export const QUOTE_EXPIRY_DAYS = 3;
export const STREAK_LOOKBACK_DAYS = 60;

export interface AlertCounts { critical: number; high: number; other: number }
/** What a pile of open alerts means: anything critical or high is for action now, the rest is worth watching. */
export const statusOfAlerts = (c: AlertCounts): MonitorStatus => (c.critical + c.high > 0 ? 'act' : c.other > 0 ? 'watch' : 'ok');
/** A signal is critical (can never be left unseen) when it is pinned and needs action, or when it is a critical alert. */
export const isCriticalFlag = (def: SignalDef, status: MonitorStatus): boolean => status === 'act' && (def.pinned || def.group === 'safety');

export type Direction = 'up' | 'down' | 'flat';
/** The change since the last check: the direction and, where there was something to compare, the percentage. */
export function trendOf(current: number | null, previous: number | null): { direction: Direction | null; pct: number | null } {
  if (current === null || previous === null) return { direction: null, pct: null };
  if (current === previous) return { direction: 'flat', pct: 0 };
  return { direction: current > previous ? 'up' : 'down', pct: previous === 0 ? null : Math.round((Math.abs(current - previous) / Math.abs(previous)) * 100) };
}
export const isBetter = (def: SignalDef, d: Direction | null): boolean | null => (d === null || d === 'flat' ? null : (def.good === 'up') === (d === 'up'));

export type ConfigProblem = 'too_many' | 'unknown_signal' | 'none' | 'time_invalid' | 'days_invalid';
export function configProblem(ids: string[], time: string, days: number[]): ConfigProblem | null {
  const chosen = [...new Set(ids)].filter((id) => !PINNED_IDS.includes(id));
  if (chosen.some((id) => !signalDef(id))) return 'unknown_signal';
  if (chosen.length > MAX_CONFIGURED) return 'too_many';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return 'time_invalid';
  if (days.length === 0 || days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return 'days_invalid';
  return null;
}
/** What is on the panel: the pinned signals first, then the chosen ones in the order chosen. */
export const panelIds = (chosen: string[]): string[] => [...PINNED_IDS, ...[...new Set(chosen)].filter((id) => !PINNED_IDS.includes(id) && signalDef(id))];

export const dayKey = (ms: number): string => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const todayAt = (time: string, now: number): number => { const [h, m] = time.split(':').map(Number); const d = new Date(now); d.setHours(h, m, 0, 0); return d.getTime(); };

/** Consecutive check days (counting back from today, today not yet required) on which a check was made. Days the Admin does not check, or is away, neither add nor break it. */
export function streakOf(checked: Set<string>, checkWeekdays: number[], away: (key: string) => boolean, now: number): number {
  let n = 0;
  for (let i = 0; i < STREAK_LOOKBACK_DAYS; i += 1) {
    const ms = now - i * 86_400_000;
    const key = dayKey(ms);
    const counts = checkWeekdays.includes(new Date(ms).getDay()) && !away(key);
    if (!counts) continue;
    if (checked.has(key)) n += 1;
    else if (i > 0) break;
  }
  return n;
}

export const hashText = (s: string): string => { let h = 5381; for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(16).padStart(8, '0'); };
export const snapshotHash = (values: Record<string, number | null>, statuses: Record<string, MonitorStatus>): string => hashText(JSON.stringify(Object.keys(values).sort().map((k) => [k, values[k], statuses[k]])));

export type CheckProblem = 'signals_need_you' | 'note_short' | 'not_admin';
/** "Everything is fine" is only a true statement when nothing in view needs the Admin: otherwise the check is recorded as "with concerns", and says what. */
export function checkProblem(kind: CheckKind, actIds: string[], note: string): CheckProblem | null {
  if (kind === 'all_fine') return actIds.length > 0 ? 'signals_need_you' : null;
  return note.replace(/[^\p{L}]/gu, '').length < NOTE_MIN ? 'note_short' : null;
}
