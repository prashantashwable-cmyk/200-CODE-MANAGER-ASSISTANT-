import type { PoFulfilmentStage, PurchaseOrderLineItem, Supplier, SupplierPurchaseOrder } from '@/data/types';
import { promisedDeliveryOf } from './agreement';

/**
 * A sent PO's fulfilment status (095), pure — the board, the delay flag and
 * the follow-up engine's "please update us" commitment all read this, so a
 * PO has one true status wherever it's shown.
 */

export const FULFILMENT_STAGES: PoFulfilmentStage[] = ['sent', 'acknowledged', 'in_production', 'ready_to_ship', 'shipped', 'delivered'];

export const stageIndex = (stage: PoFulfilmentStage) => FULFILMENT_STAGES.indexOf(stage);

/** Stages a supplier may set on their own PO. Delivery is AIEC's receipt,
 *  confirmed by AIEC — never self-declared by the party being paid for it. */
export const SUPPLIER_SETTABLE_STAGES: PoFulfilmentStage[] = ['acknowledged', 'in_production', 'ready_to_ship', 'shipped'];

/** Used until a supplier has at least two finished examples of a stage.
 *  In production defaults to the supplier's own stated average lead time. */
const DEFAULT_STAGE_DAYS: Record<Exclude<PoFulfilmentStage, 'delivered'>, number> = {
  sent: 1,
  acknowledged: 2,
  in_production: 14,
  ready_to_ship: 2,
  shipped: 3,
};

const MIN_SAMPLES = 2;
/** A stage "passed" in under six hours is a burst of catch-up updates (a
 *  supplier ticking through stages at once), not a real duration — it's
 *  left out so it can't drag the supplier's typical time down. */
const MIN_OBSERVED_DAYS = 0.25;
/** Past this share of the supplier's own typical time in a stage, the PO is
 *  trending late — personal to the supplier, not one number for everyone. */
export const AT_RISK_RATIO = 1.5;

const DAY = 86_400_000;

/** A line's stage — its own if recorded, else derived from the PO. */
export function lineStageOf(po: SupplierPurchaseOrder, line: PurchaseOrderLineItem): PoFulfilmentStage {
  if (line.fulfilmentStage) return line.fulfilmentStage;
  if (po.receivedAt) return 'delivered';
  if (po.acknowledgedAt) return 'acknowledged';
  return 'sent';
}

export function lineStageEnteredAt(po: SupplierPurchaseOrder, line: PurchaseOrderLineItem): string {
  if (line.stageEnteredAt) return line.stageEnteredAt;
  if (po.receivedAt) return po.receivedAt;
  return po.acknowledgedAt ?? po.sentAt ?? po.triggeredAt;
}

/** The PO's own stage is its least-advanced line — "shipped" only once
 *  every part has shipped. */
export function poStageOf(po: SupplierPurchaseOrder): PoFulfilmentStage {
  const lines = po.lineItems ?? [];
  if (lines.length === 0) return po.receivedAt ? 'delivered' : po.acknowledgedAt ? 'acknowledged' : 'sent';
  return lines.map((l) => lineStageOf(po, l)).reduce((min, s) => (stageIndex(s) < stageIndex(min) ? s : min));
}

/** When the PO's least-advanced line entered its stage. */
export function poStageEnteredAt(po: SupplierPurchaseOrder): string {
  const stage = poStageOf(po);
  const lines = (po.lineItems ?? []).filter((l) => lineStageOf(po, l) === stage);
  const times = lines.map((l) => lineStageEnteredAt(po, l)).sort();
  return times[0] ?? po.sentAt ?? po.triggeredAt;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * How long a stage usually takes *this* supplier, learned from their own
 * finished stages: for every line, the time from entering a stage to next
 * moving forward out of it. Rework (a backward move) isn't counted as a
 * normal duration.
 */
export function typicalStageDays(
  supplier: Supplier | undefined,
  stage: PoFulfilmentStage,
  allPurchaseOrders: SupplierPurchaseOrder[],
): { days: number; isDefault: boolean; samples: number } {
  if (stage === 'delivered') return { days: 0, isDefault: false, samples: 0 };
  // One stage move of a PO is one observation, however many lines it moved
  // together — otherwise a five-line PO would outvote a one-line one.
  const observed = new Map<string, number>();
  for (const po of allPurchaseOrders) {
    if (!supplier || po.supplierId !== supplier.id || !po.statusEvents?.length) continue;
    for (const line of po.lineItems ?? []) {
      const events = po.statusEvents.filter((e) => e.lineItemIds.includes(line.id)).sort((a, b) => (a.at < b.at ? -1 : 1));
      let enteredAt: string | null = stage === 'sent' ? (po.sentAt ?? null) : null;
      for (const e of events) {
        if (enteredAt && e.fromStage === stage && stageIndex(e.toStage) > stageIndex(stage)) {
          const duration = (new Date(e.at).getTime() - new Date(enteredAt).getTime()) / DAY;
          if (duration >= MIN_OBSERVED_DAYS) observed.set(`${po.id}|${enteredAt}|${e.at}`, duration);
          enteredAt = null;
        }
        if (e.toStage === stage) enteredAt = e.at;
      }
    }
  }
  const durations = [...observed.values()];
  if (durations.length >= MIN_SAMPLES) return { days: Math.max(0.5, Math.round(median(durations) * 10) / 10), isDefault: false, samples: durations.length };
  const fallback =
    stage === 'in_production' && supplier && supplier.avgLeadTimeDays > 0 ? supplier.avgLeadTimeDays : DEFAULT_STAGE_DAYS[stage];
  return { days: fallback, isDefault: true, samples: durations.length };
}

export type DelayRisk = 'on_track' | 'at_risk' | 'overdue';

export interface DelayAssessment {
  stage: PoFulfilmentStage;
  stageEnteredAt: string;
  daysInStage: number;
  typicalDays: number;
  typicalIsDefault: boolean;
  /** Stage entry + this supplier's typical time for every stage left. */
  projectedDelivery: string | null;
  risk: DelayRisk;
}

/** The delay_risk_flag, computed on read — never stored, so never stale. */
export function assessDelay(
  po: SupplierPurchaseOrder,
  supplier: Supplier | undefined,
  allPurchaseOrders: SupplierPurchaseOrder[],
  now: number,
): DelayAssessment {
  const stage = poStageOf(po);
  const enteredAt = poStageEnteredAt(po);
  const daysInStage = Math.max(0, (now - new Date(enteredAt).getTime()) / DAY);
  const typical = typicalStageDays(supplier, stage, allPurchaseOrders);
  if (stage === 'delivered') {
    return { stage, stageEnteredAt: enteredAt, daysInStage, typicalDays: 0, typicalIsDefault: false, projectedDelivery: po.receivedAt ?? enteredAt, risk: 'on_track' };
  }
  // Whatever is left of this stage (never less than zero), then every
  // remaining stage at this supplier's own typical pace.
  let remaining = Math.max(0, typical.days - daysInStage);
  for (const later of FULFILMENT_STAGES.slice(stageIndex(stage) + 1, stageIndex('delivered'))) {
    remaining += typicalStageDays(supplier, later, allPurchaseOrders).days;
  }
  const projected = now + remaining * DAY;
  // Held to the promised date: Admin's own, or the supplier's agreed SLA (098).
  const promised = promisedDeliveryOf(po);
  const expected = promised ? new Date(promised).getTime() : null;
  let risk: DelayRisk = 'on_track';
  if (expected !== null && now > expected) risk = 'overdue';
  else if ((expected !== null && projected > expected) || daysInStage > typical.days * AT_RISK_RATIO) risk = 'at_risk';
  return {
    stage,
    stageEnteredAt: enteredAt,
    daysInStage: Math.round(daysInStage * 10) / 10,
    typicalDays: typical.days,
    typicalIsDefault: typical.isDefault,
    projectedDelivery: new Date(projected).toISOString(),
    risk,
  };
}
