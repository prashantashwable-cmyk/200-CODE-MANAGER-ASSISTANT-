import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { TransitTotals, WorkforcePayoutTotals } from '@/data/repository';
import type { OutflowTotals } from '@/features/suppliers/paymentSchedule';
import type { Payment } from '@/data/types';
import { bucketFor, computeCashIn, computeTotalReceivable, isOutstanding, OUTLIER_MULTIPLE, remainingBalance } from '@/features/payments/aging';
import type { AgingBucket, AgingGroup, FinanceStatus, FinanceSummary, UpcomingOutflow } from './finance.types';

type WindowId = '7' | '30';

interface FinanceState {
  status: FinanceStatus;
  summary: FinanceSummary | null;
  /** Context only: money committed to suppliers for parts not yet delivered (106). */
  inTransit: TransitTotals | null;
  payouts: WorkforcePayoutTotals | null;
  /** Context only: what is owed to suppliers and coming, read from 114's schedule. */
  supplierOutflows: OutflowTotals | null;
  agingGroups: AgingGroup[];
  upcoming: UpcomingOutflow[];
  window: WindowId;
  setWindow: (window: WindowId) => void;
  reload: () => Promise<void>;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Owns the financial overview.
 *
 * This is a deliberate read-only reflection of the Payments module — every
 * figure here is derived from the same `Payment` records rather than a second,
 * separately maintained number, which is the reconciliation guarantee the spec
 * asks for.
 */
export function useFinance(): FinanceState {
  const repository = useData();
  const [status, setStatus] = useState<FinanceStatus>('loading');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [window, setWindow] = useState<WindowId>('30');
  const { user } = useSession();
  const [inTransit, setInTransit] = useState<TransitTotals | null>(null);
  const [payouts, setPayouts] = useState<WorkforcePayoutTotals | null>(null);
  const [supplierOutflows, setSupplierOutflows] = useState<OutflowTotals | null>(null);

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const list = await repository.listPayments();
      setPayments(list);
      // Context, never a reason to fail the overview.
      if (user) setInTransit(await repository.getInTransitTotals(user.id).catch(() => null));
      if (user) setPayouts(await repository.getWorkforcePayoutTotals(user.id).catch(() => null));
      if (user) setSupplierOutflows(await repository.getUpcomingSupplierOutflows(user.id).catch(() => null));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [repository, user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const now = Date.now();

  const outstanding = useMemo(() => payments.filter(isOutstanding), [payments]);

  const agingGroups = useMemo<AgingGroup[]>(() => {
    const buckets: Record<AgingBucket, Payment[]> = {
      current: [],
      d30: [],
      d60: [],
      d90plus: [],
      disputed: [],
    };
    for (const payment of outstanding) {
      buckets[bucketFor(payment, now)].push(payment);
    }
    return (Object.keys(buckets) as AgingBucket[]).map((bucket) => ({
      bucket,
      payments: buckets[bucket],
      total: buckets[bucket].reduce((sum, p) => sum + remainingBalance(p), 0),
    }));
  }, [outstanding, now]);

  const upcoming = useMemo<UpcomingOutflow[]>(() => {
    const days = Number(window);
    const cutoff = now + days * 86_400_000;
    return payments
      .filter((p) => p.status === 'due' || p.status === 'pending')
      .filter((p) => new Date(p.dueDate).getTime() <= cutoff)
      .map((p) => ({
        payment: p,
        daysUntilDue: Math.ceil((new Date(p.dueDate).getTime() - now) / 86_400_000),
      }))
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [payments, window, now]);

  const summary = useMemo<FinanceSummary | null>(() => {
    if (status !== 'ready') return null;
    const cashIn = computeCashIn(payments);
    // Supplier and payout outflows are not separately modelled in this build's
    // data yet, so cashOut reflects what is actually tracked: retention held
    // and refunds. Documented here rather than inventing a second figure.
    const cashOut = payments
      .filter((p) => p.status === 'refunded')
      .reduce((sum, p) => sum + p.amount, 0);

    const amounts = outstanding.map(remainingBalance);
    const med = median(amounts);
    const totalReceivable = computeTotalReceivable(payments);
    const skewedByOutlier = amounts.some((v) => med > 0 && v >= med * OUTLIER_MULTIPLE);

    return {
      cashIn,
      cashOut,
      netPosition: cashIn - cashOut,
      totalReceivable,
      medianReceivable: med,
      skewedByOutlier,
    };
  }, [status, payments, outstanding]);

  return { status, summary, inTransit, payouts, supplierOutflows, agingGroups, upcoming, window, setWindow, reload };
}
