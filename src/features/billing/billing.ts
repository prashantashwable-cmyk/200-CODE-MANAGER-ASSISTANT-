/**
 * What AIEC pays to keep its own software running (197): the services it depends on, their plans, what usage costs under each plan, and when a bill is about to go wrong.
 * Pure: the screen and the repository judge with the same rules. Prices, limits and thresholds are placeholders for the owner to replace with each provider's real plan.
 */
export type ServiceId = 'hosting' | 'whatsapp' | 'sms' | 'maps' | 'payment_gateway' | 'id_verification';
export type Support = 'community' | 'business' | 'always';
const SUPPORT_RANK: Record<Support, number> = { community: 0, business: 1, always: 2 };

export interface TierDef {
  id: string;
  priceMonthly: number;
  included: number;
  /** Rupees for each unit beyond what the plan includes. */
  overageRate: number;
  /** The most the plan lets through per minute; null where the provider sets none. */
  ratePerMin: number | null;
  support: Support;
  features: string[];
}
export interface ServiceDef {
  id: ServiceId;
  /** Everything automated depends on it: a lapse is a critical exception. */
  critical: boolean;
  metric: 'operations' | 'messages' | 'requests' | 'transactions' | 'checks';
  /** The busiest minute the business has needed from it (a placeholder until a real connector reports it). */
  peakPerMin: number;
  /** Paid by card on the provider's bill, or taken out of what the provider pays AIEC. */
  payBy: 'card' | 'settlement';
  /** The screen that owns the connection itself. */
  route: string | null;
  tiers: TierDef[];
}

export const SERVICES: ServiceDef[] = [
  { id: 'hosting', critical: true, metric: 'operations', peakPerMin: 3500, payBy: 'card', route: '/system-health', tiers: [
    { id: 'spark', priceMonthly: 0, included: 50, overageRate: 90, ratePerMin: 600, support: 'community', features: [] },
    { id: 'standard', priceMonthly: 2500, included: 400, overageRate: 6, ratePerMin: 6000, support: 'business', features: ['backups_daily'] },
    { id: 'scale', priceMonthly: 9000, included: 2000, overageRate: 4, ratePerMin: 30000, support: 'always', features: ['backups_daily', 'uptime_sla'] },
  ] },
  { id: 'whatsapp', critical: true, metric: 'messages', peakPerMin: 120, payBy: 'card', route: '/admin/comm/templates', tiers: [
    { id: 'starter', priceMonthly: 0, included: 1000, overageRate: 0.85, ratePerMin: 80, support: 'community', features: [] },
    { id: 'growth', priceMonthly: 3000, included: 5000, overageRate: 0.6, ratePerMin: 200, support: 'business', features: ['templates', 'analytics'] },
    { id: 'scale', priceMonthly: 9000, included: 20000, overageRate: 0.45, ratePerMin: 1000, support: 'always', features: ['templates', 'analytics', 'priority_support'] },
  ] },
  { id: 'sms', critical: true, metric: 'messages', peakPerMin: 90, payBy: 'card', route: '/admin/comm/templates', tiers: [
    { id: 'pay_go', priceMonthly: 0, included: 0, overageRate: 0.25, ratePerMin: 60, support: 'community', features: [] },
    { id: 'pack', priceMonthly: 1500, included: 8000, overageRate: 0.18, ratePerMin: 300, support: 'business', features: ['delivery_reports'] },
    { id: 'bulk', priceMonthly: 5000, included: 40000, overageRate: 0.12, ratePerMin: 1000, support: 'always', features: ['delivery_reports', 'sender_id'] },
  ] },
  { id: 'maps', critical: false, metric: 'requests', peakPerMin: 800, payBy: 'card', route: null, tiers: [
    { id: 'free_credit', priceMonthly: 0, included: 28000, overageRate: 0.45, ratePerMin: 3000, support: 'community', features: [] },
    { id: 'standard', priceMonthly: 4000, included: 100000, overageRate: 0.3, ratePerMin: 10000, support: 'business', features: ['route_optimisation'] },
  ] },
  { id: 'payment_gateway', critical: true, metric: 'transactions', peakPerMin: 40, payBy: 'settlement', route: '/my-payments', tiers: [
    { id: 'standard', priceMonthly: 0, included: 0, overageRate: 6, ratePerMin: 120, support: 'business', features: [] },
    { id: 'pro', priceMonthly: 2500, included: 0, overageRate: 3, ratePerMin: 600, support: 'always', features: ['settlement_t1', 'priority_support'] },
  ] },
  { id: 'id_verification', critical: false, metric: 'checks', peakPerMin: 10, payBy: 'card', route: '/verification', tiers: [
    { id: 'pay_go', priceMonthly: 0, included: 0, overageRate: 25, ratePerMin: 30, support: 'community', features: [] },
    { id: 'bundle', priceMonthly: 2000, included: 100, overageRate: 18, ratePerMin: 120, support: 'business', features: ['bulk_checks'] },
  ] },
];
export const serviceDef = (id: string): ServiceDef | undefined => SERVICES.find((s) => s.id === id);
export const tierDef = (s: ServiceDef, id: string): TierDef | undefined => s.tiers.find((t) => t.id === id);

export const RENEW_WARN_DAYS = 7;
export const CARD_WARN_DAYS = 30;
export const GRACE_DAYS = 5;
export const RETRY_DAYS = 1;
export const MAX_ATTEMPTS = 3;
export const SPIKE_RATIO = 1.5;
export const SAVING_MIN_PCT = 10;
export const SAVING_MIN_RS = 300;
export const HEADROOM = 0.85;
export const NOTE_MIN = 10;
export const REASON_MIN = 10;
export const HISTORY_MONTHS = 6;

export const costOf = (t: TierDef, used: number): { base: number; overage: number; total: number } => {
  const overage = Math.round(Math.max(0, used - t.included) * t.overageRate);
  return { base: t.priceMonthly, overage, total: t.priceMonthly + overage };
};

export type Tradeoff = 'rate_limit_below_need' | 'lower_rate_limit' | 'support_lower' | 'features_lost' | 'overage_exposure' | 'free_allowance_small';
export interface TierRow { tierId: string; avgCost: number; peakCost: number; capacityUsed: number | null; tradeoffs: Tradeoff[]; lost: string[]; current: boolean }
export interface Advice { direction: 'same' | 'down' | 'up'; best: string; savingMonthly: number; rows: TierRow[]; why: 'cheaper' | 'overage' | 'fits' | 'blocked' }

/** What each plan would have cost for the months actually used, and what a person would give up by moving to it. */
export function adviceOf(def: ServiceDef, currentId: string, usage: number[]): Advice {
  const cur = tierDef(def, currentId) ?? def.tiers[0];
  const recent = usage.slice(-3);
  const peak = Math.max(0, ...usage);
  const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const rows: TierRow[] = def.tiers.map((t) => {
    const costs = recent.map((u) => costOf(t, u).total);
    const avgCost = Math.round(mean(costs));
    const peakCost = Math.max(0, ...usage.map((u) => costOf(t, u).total));
    const tradeoffs: Tradeoff[] = [];
    const lost = cur.features.filter((f) => !t.features.includes(f));
    if (t.ratePerMin !== null && t.ratePerMin < def.peakPerMin) tradeoffs.push('rate_limit_below_need');
    else if (t.ratePerMin !== null && cur.ratePerMin !== null && t.ratePerMin < cur.ratePerMin) tradeoffs.push('lower_rate_limit');
    if (SUPPORT_RANK[t.support] < SUPPORT_RANK[cur.support]) tradeoffs.push('support_lower');
    if (lost.length > 0) tradeoffs.push('features_lost');
    if (avgCost > 0 && peakCost > avgCost * 1.3 && t.id !== cur.id) tradeoffs.push('overage_exposure');
    return { tierId: t.id, avgCost, peakCost, capacityUsed: t.included > 0 ? Math.round((peak / t.included) * 100) / 100 : null, tradeoffs, lost, current: t.id === cur.id };
  });
  const curRow = rows.find((r) => r.current) as TierRow;
  // Cheapest plan that does not break what the business needs (a rate limit below the busiest minute is a block, never a saving).
  const viable = rows.filter((r) => !r.tradeoffs.includes('rate_limit_below_need'));
  const cheapest = [...viable].sort((a, b) => a.avgCost - b.avgCost)[0] ?? curRow;
  const saving = curRow.avgCost - cheapest.avgCost;
  const overageShare = (() => { const c = recent.map((u) => costOf(cur, u)); const tot = c.reduce((a, b) => a + b.total, 0); return tot === 0 ? 0 : c.reduce((a, b) => a + b.overage, 0) / tot; })();
  if (cheapest.tierId !== curRow.tierId && saving >= SAVING_MIN_RS && saving >= (curRow.avgCost * SAVING_MIN_PCT) / 100) {
    const toTier = tierDef(def, cheapest.tierId) as TierDef;
    return { direction: toTier.priceMonthly < cur.priceMonthly ? 'down' : 'up', best: cheapest.tierId, savingMonthly: saving, rows, why: overageShare >= 0.2 && toTier.priceMonthly > cur.priceMonthly ? 'overage' : 'cheaper' };
  }
  const blocked = rows.some((r) => !r.current && r.avgCost < curRow.avgCost && r.tradeoffs.includes('rate_limit_below_need'));
  return { direction: 'same', best: curRow.tierId, savingMonthly: 0, rows, why: blocked ? 'blocked' : 'fits' };
}

/** A month that stands well above what the three before it used: understandable, not a surprise bill. */
export function spikeOf(usage: number[], index: number): { spike: boolean; ratio: number; baseline: number } {
  if (index < 1) return { spike: false, ratio: 1, baseline: 0 };
  const prev = usage.slice(Math.max(0, index - 3), index).sort((a, b) => a - b);
  const baseline = prev[Math.floor(prev.length / 2)] ?? 0;
  const ratio = baseline > 0 ? usage[index] / baseline : 1;
  return { spike: baseline > 0 && ratio >= SPIKE_RATIO && usage[index] - baseline >= Math.max(5, baseline * 0.2), ratio: Math.round(ratio * 100) / 100, baseline };
}

export type BillingState = 'ok' | 'renewing_soon' | 'card_expiring' | 'card_expired' | 'payment_failed' | 'lapsed' | 'no_card';
export interface BillingInput {
  payBy: 'card' | 'settlement';
  autoRenew: boolean;
  renewalDate: string;
  card: { last4: string; expiry: string } | null;
  lastInvoiceStatus: 'paid' | 'failed' | 'pending' | null;
  /** True when the plan could charge something (a price or usage past what it includes). */
  charges: boolean;
}
const monthEnd = (ym: string): number => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0, 23, 59, 59).getTime(); };
/** The most serious thing wrong with how a service is paid for, or ok. Ordered worst first. */
export function billingStateOf(i: BillingInput, now: number): { state: BillingState; daysToRenewal: number; cardDays: number | null } {
  const daysToRenewal = Math.ceil((Date.parse(i.renewalDate) - now) / 86_400_000);
  const cardDays = i.card ? Math.ceil((monthEnd(i.card.expiry) - now) / 86_400_000) : null;
  let state: BillingState = 'ok';
  if (i.lastInvoiceStatus === 'failed' && daysToRenewal < -GRACE_DAYS) state = 'lapsed';
  else if (i.lastInvoiceStatus === 'failed') state = 'payment_failed';
  else if (i.payBy === 'card' && i.charges && !i.card) state = 'no_card';
  else if (i.payBy === 'card' && i.card && cardDays !== null && cardDays < 0) state = 'card_expired';
  else if (i.payBy === 'card' && i.card && cardDays !== null && (cardDays <= CARD_WARN_DAYS || monthEnd(i.card.expiry) < Date.parse(i.renewalDate))) state = 'card_expiring';
  else if (!i.autoRenew && daysToRenewal <= RENEW_WARN_DAYS) state = 'renewing_soon';
  return { state, daysToRenewal, cardDays };
}
export const SEVERE: BillingState[] = ['lapsed', 'payment_failed', 'card_expired', 'no_card'];

export const isValidExpiry = (s: string): boolean => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
export const isValidLast4 = (s: string): boolean => /^\d{4}$/.test(s);
export const monthIdOf = (ms: number): string => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
export const addMonthsMs = (ms: number, n: number): number => { const d = new Date(ms); d.setMonth(d.getMonth() + n); return d.getTime(); };
