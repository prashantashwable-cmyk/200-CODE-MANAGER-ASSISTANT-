/**
 * Partner tiers, pure (148). A tier is a plain ladder with visible criteria, so a partner can see exactly what the next step needs. Suppliers keep
 * the trust tiers 100 already runs payment terms from (their bar is 100's own graduation rule, never copied here); surveyors and technicians get
 * ladders whose tiers set real defaults elsewhere (commission, and who may lead a job). Criteria are versioned: raising the bar never silently
 * reassesses anyone, it puts existing partners up for a grandfather review.
 */
import { GRADUATION_MIN_ORDERS, GRADUATION_MIN_SCORE } from '@/features/suppliers/paymentTerms';
import { days } from '@/features/sla/clock';

export type TierRole = 'surveyor' | 'technician' | 'supplier';
export const TIER_ROLES: TierRole[] = ['surveyor', 'technician', 'supplier'];
export const TIER_IDS: Record<TierRole, string[]> = { surveyor: ['new', 'established', 'senior'], technician: ['trainee', 'certified', 'master'], supplier: ['new', 'standard', 'trusted'] };
export const METRICS = ['monthsActive', 'wonDeals', 'completedInstalls', 'verifiedSkills', 'qcPassRate', 'openSafetyIssues', 'ratedOrders', 'score'] as const;
export type Metric = (typeof METRICS)[number];
export type Metrics = Record<Metric, number>;

export interface Criterion {
  metric: Metric;
  min?: number;
  max?: number;
}
export interface TierEffects {
  /** Surveyor: points added to the conversion share the agreement sets. */
  commissionPlusPct?: number;
  /** Technician: may be made a job's lead (or hold a delegation of it). */
  canLead?: boolean;
}
export interface TierDef {
  id: string;
  criteria: Criterion[];
  effects: TierEffects;
}

export const DEFAULT_CRITERIA: Record<'surveyor' | 'technician', TierDef[]> = {
  surveyor: [
    { id: 'new', criteria: [], effects: { commissionPlusPct: 0 } },
    { id: 'established', criteria: [{ metric: 'monthsActive', min: 3 }, { metric: 'wonDeals', min: 2 }], effects: { commissionPlusPct: 0.25 } },
    { id: 'senior', criteria: [{ metric: 'monthsActive', min: 9 }, { metric: 'wonDeals', min: 6 }], effects: { commissionPlusPct: 0.5 } },
  ],
  technician: [
    { id: 'trainee', criteria: [], effects: { canLead: false } },
    { id: 'certified', criteria: [{ metric: 'completedInstalls', min: 1 }, { metric: 'verifiedSkills', min: 1 }, { metric: 'qcPassRate', min: 80 }], effects: { canLead: true } },
    { id: 'master', criteria: [{ metric: 'completedInstalls', min: 5 }, { metric: 'verifiedSkills', min: 3 }, { metric: 'qcPassRate', min: 90 }, { metric: 'openSafetyIssues', max: 0 }], effects: { canLead: true } },
  ],
};

/** What the supplier ladder asks, read from 100's own rule so the two cannot disagree. */
export const supplierCriteria = (): Criterion[] => [{ metric: 'ratedOrders', min: GRADUATION_MIN_ORDERS }, { metric: 'score', min: GRADUATION_MIN_SCORE * 100 }];

export interface CriterionResult {
  metric: Metric;
  required: number;
  actual: number;
  kind: 'min' | 'max';
  ok: boolean;
}

export function evaluate(criteria: Criterion[], m: Metrics): CriterionResult[] {
  return criteria.map((c): CriterionResult => {
    const actual = m[c.metric];
    return c.min !== undefined ? { metric: c.metric, required: c.min, actual, kind: 'min', ok: actual >= c.min } : { metric: c.metric, required: c.max as number, actual, kind: 'max', ok: actual <= (c.max as number) };
  });
}

/** The highest tier whose criteria (and every lower tier's) are all met. */
export function eligibleIndex(tiers: { criteria: Criterion[] }[], m: Metrics): number {
  let best = 0;
  for (let i = 1; i < tiers.length; i += 1) {
    if (!evaluate(tiers[i].criteria, m).every((r) => r.ok)) break;
    best = i;
  }
  return best;
}

export const indexOf = (role: TierRole, tier: string): number => Math.max(0, TIER_IDS[role].indexOf(tier));
export const directionOf = (role: TierRole, from: string, to: string): 'up' | 'down' | 'same' => (indexOf(role, to) > indexOf(role, from) ? 'up' : indexOf(role, to) < indexOf(role, from) ? 'down' : 'same');

export const REASON_MIN = 20;
export const EFFECTIVE_MAX_DAYS = 30;
export const DEFER_MAX_DAYS = 60;
/** After raising the bar, existing partners who no longer meet their tier are reviewed within this long, not reassessed at once (placeholder). */
export const REVIEW_WITHIN = days(60);
/** An incident in this window puts a promotion's timing in question (placeholder). */
export const INCIDENT_WINDOW = days(30);
export const DISPUTE_DECIDE_DUE = days(3);

export type CriteriaProblem = 'tiers_shape' | 'not_rising' | 'unknown_metric' | 'effective_past' | 'reason_required';
/** A new version must keep the same ladder, and every higher tier must ask at least as much as the one below it on the same measure. */
export function criteriaProblem(role: 'surveyor' | 'technician', tiers: TierDef[], todayKey: string, effectiveFrom: string, note: string): CriteriaProblem | null {
  if (tiers.length !== TIER_IDS[role].length || tiers.some((t, i) => t.id !== TIER_IDS[role][i])) return 'tiers_shape';
  for (const t of tiers) if (t.criteria.some((c) => !(METRICS as readonly string[]).includes(c.metric) || (c.min === undefined && c.max === undefined))) return 'unknown_metric';
  for (let i = 1; i < tiers.length; i += 1) {
    for (const c of tiers[i - 1].criteria) {
      const next = tiers[i].criteria.find((x) => x.metric === c.metric);
      if (!next) return 'not_rising';
      if (c.min !== undefined && (next.min ?? -1) < c.min) return 'not_rising';
      if (c.max !== undefined && (next.max ?? Infinity) > c.max) return 'not_rising';
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom) || effectiveFrom < todayKey) return 'effective_past';
  return note.replace(/[^\p{L}\p{N}]/gu, '').length < REASON_MIN ? 'reason_required' : null;
}
