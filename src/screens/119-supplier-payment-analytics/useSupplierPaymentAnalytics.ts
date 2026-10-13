import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { AnalyticsMonths, SupplierPaymentAnalytics } from '@/data/repository';
import type { AnalyticsStatus, AnalyticsTab, SpendGroup } from './supplier-payment-analytics.types';
import { DEFAULT_MONTHS, NOTE_LABEL_MIN, PERIODS, POLL_MS, TABS } from './supplier-payment-analytics.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export interface NoteDraft {
  month: string;
  label: string;
  note: string;
}

export type SupplierPaymentAnalyticsState = ReturnType<typeof useSupplierPaymentAnalytics>;

export function useSupplierPaymentAnalytics() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: AnalyticsTab = TABS.includes(tabParam as AnalyticsTab) ? (tabParam as AnalyticsTab) : 'spend';
  const monthsParam = Number(searchParams.get('months'));
  const months = (PERIODS.includes(monthsParam as AnalyticsMonths) ? monthsParam : DEFAULT_MONTHS) as AnalyticsMonths;
  const focusSupplier = searchParams.get('supplier');

  const patchParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next, { replace: true });
  };
  const setTab = (next: AnalyticsTab) => patchParams({ tab: next === 'spend' ? null : next });
  const setMonths = (next: AnalyticsMonths) => patchParams({ months: next === DEFAULT_MONTHS ? null : String(next) });

  const [status, setStatus] = useState<AnalyticsStatus>('loading');
  const [data, setData] = useState<SupplierPaymentAnalytics | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setData(await repository.getSupplierPaymentAnalytics(months, user.id));
      setStatus('ready');
    } catch {
      // A failed refresh never blanks figures that are already showing.
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, months]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);
  const reload = () => {
    setStatus('loading');
    void load();
  };

  /* -------------------------------------------------------- what is shown */
  /** A new relationship's first payments are set aside from the overall average unless Admin chooses to count them. */
  const [setAside, setSetAside] = useState(true);
  const [group, setGroup] = useState<SpendGroup>('suppliers');

  /* ------------------------------------------------------ explaining a month */
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<NoteDraft>({ month: '', label: '', note: '' });
  const patchDraft = (patch: Partial<NoteDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const openNote = (month: string) => {
    setDraft({ month, label: '', note: '' });
    setSheetOpen(true);
  };
  const canSave = /^\d{4}-\d{2}$/.test(draft.month) && draft.label.trim().length >= NOTE_LABEL_MIN;

  const run = async (fn: () => Promise<void>): Promise<ActionResult> => {
    setBusy(true);
    try {
      await fn();
      await load();
      return { ok: true };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };
  const saveNote = () =>
    run(async () => {
      if (!user) throw new Error('forbidden');
      await repository.saveSpendNote({ month: draft.month, label: draft.label, note: draft.note || undefined }, user.id);
      setSheetOpen(false);
    });
  const removeNote = (id: string) =>
    run(async () => {
      if (!user) throw new Error('forbidden');
      await repository.removeSpendNote(id, user.id);
    });

  const hasSpend = useMemo(() => (data?.spend.total ?? 0) > 0, [data]);

  return { status, reload, busy, data, tab, setTab, months, setMonths, focusSupplier, setAside, setSetAside, group, setGroup, sheetOpen, setSheetOpen, draft, patchDraft, openNote, canSave, saveNote, removeNote, hasSpend };
}
