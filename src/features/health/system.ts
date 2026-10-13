/**
 * Technical health of the plumbing the automation depends on (186): which integrations exist, how each is judged, and how a third party's own word is weighed against what AIEC itself observes.
 * Pure: the screen and the repository judge with the same rules. Every threshold is a placeholder flagged on the screen.
 */

export type TechStatus = 'operational' | 'degraded' | 'down';
export type ProviderStatus = TechStatus | 'unknown';
export type DemoState = 'working' | 'degraded' | 'failing';
export type IntegrationGroup = 'payments' | 'messaging' | 'maps' | 'finance' | 'banking' | 'identity' | 'logistics' | 'platform';
export type FollowUpKind = 'messages' | 'payouts' | 'statements';

export interface IntegrationDef {
  id: string;
  group: IntegrationGroup;
  /** `probe`: AIEC checks it on a rhythm. `derived`: its state already lives elsewhere in the app and is read from there. */
  monitor: 'probe' | 'derived';
  /** The provider's name as the demo knows it (a placeholder for the owner to confirm). */
  provider: string;
  /** A public status page, where one is known. Null until Admin sets it. */
  statusPage: string | null;
  /** The screen that owns this integration's own state and controls. */
  route: string | null;
  /** What may need reprocessing once the provider recovers. */
  followUp?: FollowUpKind;
}

export const INTEGRATIONS: IntegrationDef[] = [
  { id: 'payment_gateway', group: 'payments', monitor: 'probe', provider: 'PayU', statusPage: null, route: '/my-payments' },
  { id: 'whatsapp', group: 'messaging', monitor: 'probe', provider: 'WhatsApp Business API', statusPage: 'https://metastatus.com', route: '/admin/comm/templates', followUp: 'messages' },
  { id: 'sms', group: 'messaging', monitor: 'probe', provider: 'SMS provider', statusPage: null, route: '/admin/comm/templates', followUp: 'messages' },
  { id: 'maps', group: 'maps', monitor: 'probe', provider: 'Maps', statusPage: 'https://status.cloud.google.com', route: null },
  { id: 'financing_partner', group: 'finance', monitor: 'probe', provider: 'Financing partner', statusPage: null, route: '/loan-application' },
  { id: 'bank_feed', group: 'banking', monitor: 'derived', provider: 'Bank statement feed', statusPage: null, route: '/reconciliation', followUp: 'statements' },
  { id: 'payout_rail', group: 'banking', monitor: 'derived', provider: 'Banking partner (payouts)', statusPage: null, route: '/payout-disbursement', followUp: 'payouts' },
  { id: 'id_verification', group: 'identity', monitor: 'derived', provider: 'ID verification service', statusPage: null, route: '/verification' },
  { id: 'carrier_tracking', group: 'logistics', monitor: 'derived', provider: 'Carrier tracking feeds', statusPage: null, route: '/delivery-partners' },
  { id: 'engine', group: 'platform', monitor: 'derived', provider: 'AIEC automation engine', statusPage: null, route: '/automation-rules' },
];
export const integrationDef = (id: string): IntegrationDef | undefined => INTEGRATIONS.find((i) => i.id === id);

/** Placeholders for the owner to confirm. */
export const PROBE_EVERY_MS = 5 * 60_000;
export const WINDOW_MS = 7 * 86_400_000;
export const DEGRADED_RATE = 0.1;
export const DOWN_RATE = 0.5;
export const MIN_CALLS = 3;
export const RECENT_PROBES = 3;
export const RECOVER_PROBES = 3;
export const CLUSTER_MS = 10 * 60_000;
export const MAX_PROBES = 2000;
export const NOTE_MIN = 15;
/** The engine is "down" when it has not beaten for this long, and "degraded" while any of its steps keeps failing. */
export const ENGINE_DOWN_MS = 5 * 60_000;
/** A bot whose handoff rate drifts this many points from what is configured is worth a look, once it has this many conversations behind it. */
export const BOT_DRIFT_POINTS = 15;
export const BOT_MIN_SAMPLE = 10;

export interface Observation {
  /** Newest last: whether each probe in the status window succeeded. */
  probes: boolean[];
  /** The real outcomes of work that went through it in the status window. */
  usageCalls: number;
  usageErrors: number;
  /** A state read from the process that owns it (the bank feed saying it is unavailable). */
  direct: TechStatus | null;
}

/** How many of the latest probes the failure share is read over. */
export const RATE_PROBES = 10;
/** The window status is judged over: what is happening now, not a bad day last week. */
export const STATUS_WINDOW_MS = 24 * 3_600_000;

/** AIEC's own judgement from what it saw. A direct "down" or a run of failed probes is down; a share of failures is degraded or down; otherwise operational. Probes that are clean again are not held against it by older failures. */
export function judge(o: Observation): { status: TechStatus; rate: number | null } {
  const usageRate = o.usageCalls >= MIN_CALLS ? o.usageErrors / o.usageCalls : null;
  const lastFew = o.probes.slice(-RECENT_PROBES);
  const cleanNow = lastFew.length >= RECENT_PROBES && lastFew.every(Boolean);
  const window = o.probes.slice(-RATE_PROBES);
  const probeRate = !cleanNow && window.length >= MIN_CALLS ? window.filter((ok) => !ok).length / window.length : 0;
  const calls = o.usageCalls + o.probes.length;
  const errors = o.usageErrors + o.probes.filter((ok) => !ok).length;
  const rate = calls >= MIN_CALLS ? errors / calls : null;
  if (o.direct === 'down') return { status: 'down', rate };
  if (lastFew.length >= RECENT_PROBES && lastFew.every((ok) => !ok)) return { status: 'down', rate };
  const worst = Math.max(usageRate ?? 0, probeRate);
  if (worst >= DOWN_RATE) return { status: 'down', rate };
  if (o.direct === 'degraded' || worst >= DEGRADED_RATE) return { status: 'degraded', rate };
  return { status: 'operational', rate };
}

const RANK: Record<ProviderStatus, number> = { operational: 0, unknown: 0, degraded: 1, down: 2 };
export type Agreement = 'agree' | 'provider_better' | 'provider_worse' | 'unknown';
/** The provider's own word against ours. When it says all is well and our calls say otherwise, ours is the one to trust. */
export function agreementOf(observed: TechStatus, reported: ProviderStatus): Agreement {
  if (reported === 'unknown') return 'unknown';
  if (RANK[reported] === RANK[observed]) return 'agree';
  return RANK[reported] < RANK[observed] ? 'provider_better' : 'provider_worse';
}

export type Cause = 'third_party' | 'ours' | 'unknown';
/** Where to look: a provider that admits a problem is waited on; one that says it is fine while our calls fail points at our side. */
export function causeOf(observed: TechStatus, reported: ProviderStatus): Cause | null {
  if (observed === 'operational') return null;
  if (reported === 'unknown') return 'unknown';
  return reported === 'operational' ? 'ours' : 'third_party';
}

export interface OpenFault { integrationId: string; startedAt: string; reported: ProviderStatus; /** False when it was already failing the first time AIEC looked: no onset was seen, so it cannot be part of a cluster. */ onsetKnown: boolean }
/** Several unrelated providers failing within minutes of each other is more likely one cause on AIEC's side (its network or hosting) than coincidence. */
export function sharedCauseOf(faults: OpenFault[]): { ids: string[]; likely: 'ours' | 'mixed' } | null {
  const sorted = faults.filter((f) => f.onsetKnown).sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1));
  let best: OpenFault[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const group = sorted.filter((f) => Date.parse(f.startedAt) >= Date.parse(sorted[i].startedAt) && Date.parse(f.startedAt) - Date.parse(sorted[i].startedAt) <= CLUSTER_MS);
    if (group.length > best.length) best = group;
  }
  if (best.length < 2) return null;
  const admitted = best.filter((f) => f.reported === 'degraded' || f.reported === 'down').length;
  // If most of them admit a problem, they are separate outages that happen to coincide; if most say they are fine, the common factor is us.
  return { ids: best.map((f) => f.integrationId), likely: admitted * 2 > best.length ? 'mixed' : 'ours' };
}

export const uptimeOf = (probes: boolean[]): number | null => (probes.length < MIN_CALLS ? null : Math.round((probes.filter(Boolean).length / probes.length) * 1000) / 10);

/** Has it recovered: enough clean probes in a row (or, with no probes to go on, a clean direct state). */
export const recovered = (probes: boolean[], direct: TechStatus | null): boolean => (direct === 'down' || direct === 'degraded' ? false : probes.length === 0 ? true : probes.slice(-RECOVER_PROBES).length >= RECOVER_PROBES && probes.slice(-RECOVER_PROBES).every(Boolean));

export const isHttpUrl = (u: string): boolean => /^https?:\/\/[^\s]+\.[^\s]+$/i.test(u.trim());
