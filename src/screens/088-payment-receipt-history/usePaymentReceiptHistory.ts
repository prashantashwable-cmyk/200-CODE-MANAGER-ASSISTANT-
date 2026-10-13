import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { PaymentReceiptLine } from '@/data/repository';
import type { PaymentHistoryScreenStatus } from './payment-receipt-history.types';

interface PaymentReceiptHistoryState {
  status: PaymentHistoryScreenStatus;
  isAdmin: boolean;
  totalPaidToDate: number;
  totalRemaining: number;
  allLines: PaymentReceiptLine[];
  filteredLines: PaymentReceiptLine[];
  dealOptions: { code: string; label: string }[];
  dealFilter: string;
  setDealFilter: (v: string) => void;
  methodFilter: string;
  setMethodFilter: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  selectedLine: PaymentReceiptLine | null;
  openReceipt: (paymentId: string) => void;
  closeReceipt: () => void;
  reload: () => Promise<void>;
}

const receiptDateOf = (line: PaymentReceiptLine) => line.payment.lastReceivedAt ?? line.payment.paidAt ?? '';

/**
 * A read-only presentation layer over the exact same Payment/Invoice rows
 * 028/082/087 already read — there is no separate receipt record, only
 * this ledger shown chronologically. Admin sees every customer's lines;
 * a customer sees only their own, aggregated across every deal they own
 * (not assumed to be exactly one).
 */
export function usePaymentReceiptHistory(): PaymentReceiptHistoryState {
  const repository = useData();
  const { user } = useSession();
  const isAdmin = user?.role === 'admin';

  const [status, setStatus] = useState<PaymentHistoryScreenStatus>('loading');
  const [allLines, setAllLines] = useState<PaymentReceiptLine[]>([]);
  const [totalPaidToDate, setTotalPaidToDate] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [dealFilter, setDealFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (isAdmin) {
        const lines = await repository.listPaymentHistoryForAdmin();
        setAllLines(lines);
        setTotalPaidToDate(lines.reduce((sum, l) => sum + l.receivedAmount, 0));
        setTotalRemaining(0);
      } else {
        const result = await repository.getPaymentHistoryForCustomer(user.id);
        setAllLines(result.lines);
        setTotalPaidToDate(result.totalPaidToDate);
        setTotalRemaining(result.totalRemaining);
      }
      setStatus('ready');
    } catch {
      setStatus((cur) => (cur === 'ready' ? cur : 'error'));
    }
  }, [repository, user, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const dealOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const line of allLines) {
      if (!seen.has(line.dealCode)) seen.set(line.dealCode, line.siteName);
    }
    return [...seen.entries()].map(([code, siteName]) => ({ code, label: `${code} · ${siteName}` }));
  }, [allLines]);

  const filteredLines = useMemo(() => {
    return allLines
      .filter((l) => dealFilter === 'all' || l.dealCode === dealFilter)
      .filter((l) => methodFilter === 'all' || l.payment.method === methodFilter)
      .filter((l) => !dateFrom || receiptDateOf(l).slice(0, 10) >= dateFrom)
      .filter((l) => !dateTo || receiptDateOf(l).slice(0, 10) <= dateTo);
  }, [allLines, dealFilter, methodFilter, dateFrom, dateTo]);

  const openReceipt = useCallback((paymentId: string) => setSelectedPaymentId(paymentId), []);
  const closeReceipt = useCallback(() => setSelectedPaymentId(null), []);

  const selectedLine = allLines.find((l) => l.payment.id === selectedPaymentId) ?? null;

  return {
    status,
    isAdmin,
    totalPaidToDate,
    totalRemaining,
    allLines,
    filteredLines,
    dealOptions,
    dealFilter,
    setDealFilter,
    methodFilter,
    setMethodFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    selectedLine,
    openReceipt,
    closeReceipt,
    reload: load,
  };
}

export { receiptDateOf };
