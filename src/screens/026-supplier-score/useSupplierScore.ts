import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SupplierScorecard } from '@/data/repository';
import type { Supplier } from '@/data/types';
import { computeSupplierPerformanceScore } from '@/features/suppliers/performanceScore';
import {
  DEFAULT_WEIGHTS,
  EARLY_DATA_ORDER_COUNT,
  WATCHLIST_THRESHOLD,
} from './supplier-score.types';
import type { ScoreStatus, ScoreWeights, SupplierScoreRow } from './supplier-score.types';

interface SupplierScoreState {
  status: ScoreStatus;
  active: SupplierScoreRow[];
  pending: Supplier[];
  weights: ScoreWeights;
  setWeight: (key: keyof ScoreWeights, value: number) => void;
  toggleWatchlist: (supplierId: string) => Promise<void>;
  reload: () => Promise<void>;
}

/** How many of the most recent months with rated deliveries, back to back, averaged below the line. Months with no delivery neither add nor break it. */
function monthsBelow(card: SupplierScorecard | undefined): number {
  if (!card) return 0;
  const byMonth = new Map<string, number[]>();
  for (const r of card.ratings) {
    const m = r.rating.deliveredAt.slice(0, 7);
    byMonth.set(m, [...(byMonth.get(m) ?? []), r.orderScore]);
  }
  let run = 0;
  for (const m of [...byMonth.keys()].sort().reverse()) {
    const xs = byMonth.get(m)!;
    if (xs.reduce((a, x) => a + x, 0) / xs.length < WATCHLIST_THRESHOLD) run += 1;
    else break;
  }
  return run;
}

/**
 * Owns the supplier scorecard.
 *
 * The overall score is a weighted composite the admin can genuinely retune —
 * weights are state, not constants, because the spec is explicit that
 * priorities (speed vs quality vs price) shift over time. Scores only count
 * completed orders; a brand-new supplier is labelled as early data rather than
 * presented as a stable score built on one order.
 */
export function useSupplierScore(): SupplierScoreState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<ScoreStatus>('loading');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS);
  const [cards, setCards] = useState<Record<string, SupplierScorecard>>({});

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const list = await repository.listSuppliers();
      // Each supplier's rated deliveries (097): what the watchlist and the early-data label are read from.
      const found = user ? await Promise.all(list.filter((x) => x.status === 'active').map((x) => repository.getSupplierScorecard(x.id, user.id).catch(() => null))) : [];
      setCards(Object.fromEntries(found.filter((c): c is SupplierScorecard => !!c).map((c) => [c.supplier.id, c])));
      setSuppliers(list);
      setStatus(list.length === 0 ? 'empty' : 'ready');
    } catch {
      setStatus('error');
    }
  }, [repository, user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setWeight = useCallback((key: keyof ScoreWeights, value: number) => {
    setWeights((current) => {
      // Renormalise so the four weights always sum to 1 rather than drifting.
      const others = Object.keys(current).filter((k) => k !== key) as (keyof ScoreWeights)[];
      const remaining = Math.max(0, 1 - value);
      const otherTotal = others.reduce((sum, k) => sum + current[k], 0) || 1;
      const next = { ...current, [key]: value };
      others.forEach((k) => {
        next[k] = (current[k] / otherTotal) * remaining;
      });
      return next;
    });
  }, []);

  const toggleWatchlist = useCallback(
    async (supplierId: string) => {
      const supplier = suppliers.find((x) => x.id === supplierId);
      if (!supplier || !user) return;
      // Kept on the supplier, so every Admin sees the same watchlist.
      const updated = await repository.setSupplierWatch(supplierId, !supplier.watchlist, user.id);
      setSuppliers((current) => current.map((x) => (x.id === supplierId ? updated : x)));
    },
    [repository, suppliers, user],
  );

  const active = useMemo<SupplierScoreRow[]>(() => {
    return suppliers
      .filter((s) => s.status === 'active')
      .map((supplier) => {
        // Price and responsiveness are not tracked in this build's data model
        // yet — a neutral 0.7 stand-in is used rather than inventing a number
        // that would look like a real metric. The UI labels this explicitly.
        const priceScore = 0.7;
        const responsivenessScore = 0.7;

        const overallScore = computeSupplierPerformanceScore(supplier, weights);

        const card = cards[supplier.id];
        // Early data means few rated deliveries, not few orders in hand.
        const isEarlyData = (card?.ratedOrders ?? 0) < EARLY_DATA_ORDER_COUNT;
        // Two months of rated deliveries in a row below the line put a supplier on the watchlist by
        // themselves; otherwise only a manual flag does.
        const monthsBelowThreshold = monthsBelow(card);
        const autoWatchlisted = monthsBelowThreshold >= 2;

        return {
          supplier,
          priceScore,
          responsivenessScore,
          overallScore,
          isEarlyData,
          onWatchlist: autoWatchlisted || !!supplier.watchlist,
          monthsBelowThreshold,
        };
      })
      .sort((a, b) => b.overallScore - a.overallScore);
  }, [suppliers, weights, cards]);

  const pending = useMemo(() => suppliers.filter((s) => s.status === 'pending_approval'), [suppliers]);

  return { status, active, pending, weights, setWeight, toggleWatchlist, reload };
}
