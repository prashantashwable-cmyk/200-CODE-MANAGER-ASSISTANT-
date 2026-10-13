import type {
  AutoPoRules,
  CategoryMatchResult,
  DriveType,
  Supplier,
  SupplierCatalogItem,
  SupplierMatchCandidate,
  SupplierMatchStrategy,
  SupplierMatchWeights,
} from '@/data/types';
import { computeSupplierPerformanceScore } from './performanceScore';

/**
 * Screen 094's supplier-matching logic, pure — the one place 092's drafting,
 * 094's simulation and every PO's "why this supplier" come from, so what
 * Admin simulates is exactly what drafting does.
 */

export const STRATEGY_PRESETS: Record<Exclude<SupplierMatchStrategy, 'blend'>, SupplierMatchWeights> = {
  price: { price: 100, speed: 0, performance: 0 },
  speed: { price: 0, speed: 100, performance: 0 },
  performance: { price: 0, speed: 0, performance: 100 },
};

export const DEFAULT_AUTO_PO_RULES: AutoPoRules = {
  autoDraftEnabled: true,
  triggerCondition: 'on_countersignature',
  strategy: 'blend',
  weights: { price: 40, speed: 20, performance: 40 },
  preferAssignedSupplier: true,
  approvalThreshold: 500_000,
  version: 1,
};

/** A brand-new supplier has no track record to score. Half marks — neither
 *  punished for being new nor ranked above a proven supplier by default. */
export const NEUTRAL_PERFORMANCE = 0.5;

/** One supplier taking this share of a simulated order's value or more is
 *  surfaced as concentration risk rather than left as a silent outcome. */
export const CONCENTRATION_WARNING_PCT = 70;

export function weightsFor(rules: Pick<AutoPoRules, 'strategy' | 'weights'>): SupplierMatchWeights {
  return rules.strategy === 'blend' ? rules.weights : STRATEGY_PRESETS[rules.strategy];
}

export function performanceFor(supplier: Supplier): { value: number; isDefault: boolean } {
  // No order ever placed means no delivery or quality record exists yet.
  if (supplier.totalOrderValue <= 0 && supplier.openOrders <= 0) return { value: NEUTRAL_PERFORMANCE, isDefault: true };
  return { value: Math.max(0, Math.min(1, computeSupplierPerformanceScore(supplier))), isDefault: false };
}

export interface MatchOffer {
  supplier: Supplier;
  item: SupplierCatalogItem;
}

/** Best first. Ties go to the lower price, then the shorter lead time. */
export function rankOffers(offers: MatchOffer[], weights: SupplierMatchWeights): SupplierMatchCandidate[] {
  if (offers.length === 0) return [];
  const sum = weights.price + weights.speed + weights.performance || 1;
  const minPrice = Math.min(...offers.map((o) => o.item.unitPrice));
  const minLead = Math.min(...offers.map((o) => o.item.leadTimeDays));
  return offers
    .map(({ supplier, item }): SupplierMatchCandidate => {
      const perf = performanceFor(supplier);
      const priceScore = item.unitPrice > 0 ? minPrice / item.unitPrice : 0;
      const speedScore = item.leadTimeDays > 0 ? minLead / item.leadTimeDays : 0;
      const total = (weights.price * priceScore + weights.speed * speedScore + weights.performance * perf.value) / sum;
      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        itemId: item.id,
        unitPrice: item.unitPrice,
        leadTimeDays: item.leadTimeDays,
        priceScore: round3(priceScore),
        speedScore: round3(speedScore),
        performanceScore: round3(perf.value),
        performanceIsDefault: perf.isDefault,
        total: round3(total),
      };
    })
    .sort((a, b) => b.total - a.total || a.unitPrice - b.unitPrice || a.leadTimeDays - b.leadTimeDays);
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Does this listing fit the deal's drive type? An empty list fits any. */
export function fitsDriveType(item: SupplierCatalogItem, driveType: DriveType | null): boolean {
  return !driveType || item.driveTypes.length === 0 || item.driveTypes.includes(driveType);
}

/**
 * One category's decision. `offersFor` returns each eligible supplier's live
 * listing for the category (cheapest if they list several).
 */
export function matchCategory(
  category: string,
  offers: MatchOffer[],
  rules: Pick<AutoPoRules, 'strategy' | 'weights' | 'preferAssignedSupplier'>,
  driveType: DriveType | null,
  assignedSupplierId: string | null,
): CategoryMatchResult {
  const fitting = offers.filter((o) => fitsDriveType(o.item, driveType));
  // Prefer a part that fits the deal's drive type; if none does, still
  // propose one — but say so, rather than silently ordering a misfit.
  const pool = fitting.length > 0 ? fitting : offers;
  const candidates = rankOffers(pool, weightsFor(rules));
  if (candidates.length === 0) {
    return { category, chosenSupplierId: null, reason: 'no_candidate', driveTypeFallback: false, candidates };
  }
  const assigned = rules.preferAssignedSupplier && assignedSupplierId ? candidates.find((c) => c.supplierId === assignedSupplierId) : undefined;
  return {
    category,
    chosenSupplierId: assigned?.supplierId ?? candidates[0].supplierId,
    reason: assigned ? 'assigned_supplier' : 'best_score',
    driveTypeFallback: fitting.length === 0,
    candidates,
  };
}

/** Share of total order value per chosen supplier, largest first. */
export function valueShareOf(results: CategoryMatchResult[]): { supplierId: string; supplierName: string; sharePct: number; value: number }[] {
  const bySupplier = new Map<string, { supplierName: string; value: number }>();
  for (const r of results) {
    const chosen = r.candidates.find((c) => c.supplierId === r.chosenSupplierId);
    if (!chosen) continue;
    const current = bySupplier.get(chosen.supplierId) ?? { supplierName: chosen.supplierName, value: 0 };
    current.value += chosen.unitPrice;
    bySupplier.set(chosen.supplierId, current);
  }
  const total = [...bySupplier.values()].reduce((s, v) => s + v.value, 0) || 1;
  return [...bySupplier]
    .map(([supplierId, v]) => ({ supplierId, supplierName: v.supplierName, value: v.value, sharePct: Math.round((v.value / total) * 100) }))
    .sort((a, b) => b.value - a.value);
}
