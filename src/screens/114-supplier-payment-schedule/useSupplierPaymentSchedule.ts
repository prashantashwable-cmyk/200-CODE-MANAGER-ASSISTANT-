import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { formatINRCompact } from '@/design-system';
import { useSession } from '@/session/SessionProvider';
import type { SupplierPaymentSchedule, SupplierPaymentScheduleItem } from '@/data/repository';
import { todayKey } from '@/features/logistics/deliverySlots';
import type { CalendarEvent, CalendarMode } from '@/features/calendar/calendarMath';
import { HORIZON_WEEKS, bucketize, outflowTotals } from '@/features/suppliers/paymentSchedule';
import type { GroupBy, ScheduleState } from '@/features/suppliers/paymentSchedule';
import type { PartFilter, PaymentScheduleStatus } from './supplier-payment-schedule.types';
import { POLL_MS } from './supplier-payment-schedule.types';

/** The same status palette 111 uses: a colour learned there means the same here. `expected` has no payment behind it yet. */
export const STATE_TONE: Record<ScheduleState, CalendarEvent['tone']> = { expected: 'emerald', owed: 'warning', waiting: 'error', held: 'neutral', approved: 'accent' };

export type SupplierPaymentScheduleState = ReturnType<typeof useSupplierPaymentSchedule>;

export function useSupplierPaymentSchedule() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();

  const [status, setStatus] = useState<PaymentScheduleStatus>('loading');
  const [schedule, setSchedule] = useState<SupplierPaymentSchedule | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setSchedule(await repository.getSupplierPaymentSchedule(user.id));
      setNow(Date.now());
      setStatus('ready');
    } catch {
      // A failed refresh never blanks a schedule that is already showing.
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);
  const reload = () => {
    setStatus('loading');
    void load();
  };

  /* ------------------------------------------------------------- filters */
  const [supplierId, setSupplierId] = useState('');
  const [part, setPart] = useState<PartFilter>('all');
  const filtered = useMemo(() => (schedule?.items ?? []).filter((i) => (!supplierId || i.supplierId === supplierId) && (part === 'all' || i.part === part)), [schedule, supplierId, part]);
  const isFiltered = supplierId !== '' || part !== 'all';
  const clearFilters = () => {
    setSupplierId('');
    setPart('all');
  };
  const totals = useMemo(() => outflowTotals(filtered, now), [filtered, now]);
  const counts = useMemo(() => {
    const today = todayKey(now);
    return {
      owedNow: filtered.filter((i) => i.state !== 'expected' && i.date !== null && i.date <= today).length,
      undated: filtered.filter((i) => i.date === null).length,
    };
  }, [filtered, now]);

  /* ------------------------------------------------------ cash-flow strip */
  const [groupBy, setGroupBy] = useState<GroupBy>('week');
  const buckets = useMemo(() => bucketize(filtered, groupBy, now), [filtered, groupBy, now]);
  const biggest = useMemo(() => Math.max(1, ...buckets.map((b) => b.amount), totals.owedNow), [buckets, totals.owedNow]);
  const heavyWeeks = useMemo(() => (groupBy === 'week' ? buckets.filter((b) => b.heavy) : bucketize(filtered, 'week', now, HORIZON_WEEKS).filter((b) => b.heavy)), [buckets, filtered, groupBy, now]);
  const averageWeek = useMemo(() => {
    const weeks = bucketize(filtered, 'week', now, HORIZON_WEEKS);
    return weeks.reduce((n, b) => n + b.amount, 0) / HORIZON_WEEKS;
  }, [filtered, now]);
  const [openBucket, setOpenBucket] = useState<string | null>(null);
  const toggleBucket = (start: string) => setOpenBucket((cur) => (cur === start ? null : start));
  const dueNowItems = useMemo(() => filtered.filter((i) => i.state !== 'expected' && i.date !== null && i.date <= todayKey(now)), [filtered, now]);
  const beyondItems = useMemo(() => {
    const last = buckets[buckets.length - 1];
    const today = todayKey(now);
    return last ? filtered.filter((i) => i.date !== null && i.date > last.end && !(i.state !== 'expected' && i.date <= today)) : [];
  }, [buckets, filtered, now]);
  const undatedItems = useMemo(() => filtered.filter((i) => i.date === null), [filtered]);

  /* ------------------------------------------------------------ calendar */
  const [mode, setMode] = useState<CalendarMode>('agenda');
  const [cursor, setCursor] = useState(() => todayKey(Date.now()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const events: CalendarEvent[] = useMemo(
    () =>
      filtered
        .filter((i) => i.date !== null)
        // Money already owed sits on the day it was owed, but an old one must not fall off the front of the calendar.
        .map((i) => ({ id: i.id, date: i.date! < todayKey(now) ? todayKey(now) : i.date!, label: `${i.supplierName.split(' ')[0]} ${formatINRCompact(i.amount)}`, tone: STATE_TONE[i.state] })),
    [filtered, now],
  );
  const byId = useMemo(() => new Map(filtered.map((i) => [i.id, i])), [filtered]);
  const itemOf = (id: string): SupplierPaymentScheduleItem | undefined => byId.get(id);
  const dayItems = useMemo(() => {
    if (!selectedDate) return [];
    const today = todayKey(now);
    return filtered.filter((i) => i.date !== null && (i.date < today ? today : i.date) === selectedDate);
  }, [filtered, selectedDate, now]);
  const selectDate = (key: string) => {
    setSelectedDate((cur) => (cur === key ? null : key));
    if (mode === 'month' && key.slice(0, 7) !== cursor.slice(0, 7)) setCursor(key);
  };
  const changeMode = (m: CalendarMode) => {
    setMode(m);
    setSelectedDate(null);
  };

  const openRelease = (i: SupplierPaymentScheduleItem) => navigate(`/supplier-payment-release?po=${i.poId}`);
  const openApproval = (i: SupplierPaymentScheduleItem) => i.paymentId && navigate(`/supplier-payments?payment=${i.paymentId}`);
  const openInvoices = (i: SupplierPaymentScheduleItem) => navigate(`/supplier-invoices?po=${i.poId}`);

  return {
    status,
    reload,
    schedule,
    now,
    supplierId,
    setSupplierId,
    part,
    setPart,
    isFiltered,
    clearFilters,
    filtered,
    totals,
    counts,
    groupBy,
    setGroupBy,
    buckets,
    biggest,
    heavyWeeks,
    averageWeek,
    openBucket,
    toggleBucket,
    dueNowItems,
    beyondItems,
    undatedItems,
    mode,
    changeMode,
    cursor,
    setCursor,
    selectedDate,
    selectDate,
    events,
    itemOf,
    dayItems,
    openRelease,
    openApproval,
    openInvoices,
  };
}
