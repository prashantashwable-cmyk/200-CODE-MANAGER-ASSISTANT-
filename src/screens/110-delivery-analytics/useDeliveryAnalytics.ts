import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { AnalyticsMonths, DeliveryAnalytics, OnTimeRowView } from '@/data/repository';
import type { AnalyticsTab, DeliveryAnalyticsStatus, OnTimeGroup } from './delivery-analytics.types';
import { ANALYTICS_TABS, DEFAULT_MONTHS, PERIODS, POLL_MS } from './delivery-analytics.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export interface DisruptionDraft {
  label: string;
  note: string;
  startsOn: string;
  endsOn: string;
}
const emptyDisruption: DisruptionDraft = { label: '', note: '', startsOn: '', endsOn: '' };

export type DeliveryAnalyticsState = ReturnType<typeof useDeliveryAnalytics>;

export function useDeliveryAnalytics() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: AnalyticsTab = ANALYTICS_TABS.includes(tabParam as AnalyticsTab) ? (tabParam as AnalyticsTab) : 'ontime';
  const monthsParam = Number(searchParams.get('months'));
  const months = (PERIODS.includes(monthsParam as AnalyticsMonths) ? monthsParam : DEFAULT_MONTHS) as AnalyticsMonths;

  const patchParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next, { replace: true });
  };
  const setTab = (next: AnalyticsTab) => patchParams({ tab: next === 'ontime' ? null : next });
  const setMonths = (next: AnalyticsMonths) => patchParams({ months: next === DEFAULT_MONTHS ? null : String(next) });

  const [status, setStatus] = useState<DeliveryAnalyticsStatus>('loading');
  const [data, setData] = useState<DeliveryAnalytics | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setData(await repository.getDeliveryAnalytics(months, user.id));
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

  /* -------------------------------------------------------- what is plotted */
  const [setAside, setSetAside] = useState(true);
  const [group, setGroup] = useState<OnTimeGroup>('suppliers');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows: OnTimeRowView[] = useMemo(() => (group === 'suppliers' ? data?.suppliers : data?.partners) ?? [], [data, group]);
  const overallRow = group === 'suppliers' ? data?.overall : data?.overallPartners;
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);
  const plotted = selected ?? overallRow ?? null;
  const pickGroup = (next: OnTimeGroup) => {
    setGroup(next);
    setSelectedId(null);
  };

  /* -------------------------------------------------------- disruptions */
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<DisruptionDraft>(emptyDisruption);
  const patchDraft = (patch: Partial<DisruptionDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const openSheet = () => {
    setDraft(emptyDisruption);
    setSheetOpen(true);
  };
  const canSave = draft.label.trim().length >= 3 && !!draft.startsOn && !!draft.endsOn;

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
  const saveDisruption = () =>
    run(async () => {
      if (!user) throw new Error('forbidden');
      await repository.saveDeliveryDisruption({ label: draft.label, note: draft.note || undefined, startsOn: draft.startsOn, endsOn: draft.endsOn }, user.id);
      setSheetOpen(false);
    });
  const removeDisruption = (id: string) =>
    run(async () => {
      if (!user) throw new Error('forbidden');
      await repository.removeDeliveryDisruption(id, user.id);
    });

  return {
    status,
    reload,
    busy,
    data,
    tab,
    setTab,
    months,
    setMonths,
    setAside,
    setSetAside,
    group,
    pickGroup,
    rows,
    selected,
    plotted,
    selectedId,
    setSelectedId,
    sheetOpen,
    setSheetOpen,
    draft,
    patchDraft,
    openSheet,
    canSave,
    saveDisruption,
    removeDisruption,
  };
}
