import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ReconBoard, ReconExceptionView, ReconRunDetail, ReconRunRow } from '@/data/repository';
import type { BankFeed, ReconReason } from '@/data/types';
import type { ReconStatus, ReconTab } from './auto-reconciliation.types';
import { NOTE_MIN, POLL_MS, SERIOUS_NOTE_MIN, TABS } from './auto-reconciliation.types';

export interface ActionResult<T = undefined> {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
  value?: T;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export type AutoReconciliationState = ReturnType<typeof useAutoReconciliation>;

export function useAutoReconciliation() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: ReconTab = TABS.includes(tabParam as ReconTab) ? (tabParam as ReconTab) : 'open';
  const exceptionParam = searchParams.get('exception');
  const runParam = searchParams.get('run');

  const patchParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next, { replace: true });
  };
  const setTab = (next: ReconTab) => patchParams({ tab: next === 'open' ? null : next });

  const [status, setStatus] = useState<ReconStatus>('loading');
  const [board, setBoard] = useState<ReconBoard | null>(null);
  const [busy, setBusy] = useState(false);
  const [runDetail, setRunDetail] = useState<ReconRunDetail | null>(null);
  const [runLoading, setRunLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBoard(await repository.getReconciliationBoard(user.id));
      setStatus('ready');
    } catch {
      // A failed refresh never blanks what is already showing.
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

  /* ------------------------------------------------------------- run detail */
  useEffect(() => {
    if (!runParam || !user) {
      setRunDetail(null);
      return;
    }
    let live = true;
    setRunLoading(true);
    repository
      .getReconciliationRun(runParam, user.id)
      .then((d) => live && setRunDetail(d))
      .catch(() => live && setRunDetail(null))
      .finally(() => live && setRunLoading(false));
    return () => {
      live = false;
    };
  }, [repository, user, runParam, board?.latest?.id]);
  const openRun = (id: string) => patchParams({ run: id });
  const closeRun = () => patchParams({ run: null });

  /* -------------------------------------------------------- exception detail */
  const exceptions: ReconExceptionView[] = useMemo(() => [...(board?.open ?? []), ...(board?.explained ?? []), ...(runDetail?.unmatched ?? [])], [board, runDetail]);
  const current: ReconExceptionView | null = useMemo(() => exceptions.find((e) => e.id === exceptionParam) ?? null, [exceptions, exceptionParam]);
  const [category, setCategory] = useState<ReconReason | ''>('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const openException = (id: string) => {
    setCategory('');
    setNote('');
    setConfirm(false);
    patchParams({ exception: id });
  };
  const closeException = () => patchParams({ exception: null });

  const serious = current?.severity === 'critical';
  const chosen: ReconReason | '' = category || (current?.canReconcileAs[0] ?? '');
  const needed = chosen === 'verified' || serious ? SERIOUS_NOTE_MIN : NOTE_MIN;
  const canSubmit = !!current && current.status === 'open' && chosen !== '' && note.trim().length >= needed && (!serious || confirm);

  const run = async <T,>(fn: () => Promise<T>): Promise<ActionResult<T>> => {
    setBusy(true);
    try {
      const value = await fn();
      await load();
      return { ok: true, value };
    } catch (e) {
      return fail(e) as ActionResult<T>;
    } finally {
      setBusy(false);
    }
  };

  const runNow = () =>
    run(async (): Promise<ReconRunRow> => {
      if (!user) throw new Error('forbidden');
      return repository.runReconciliation(user.id);
    });
  const setFeed = (next: BankFeed['status']) =>
    run(async () => {
      if (!user) throw new Error('forbidden');
      await repository.setBankFeed(next, user.id);
    });
  const reconcile = () =>
    run(async () => {
      if (!user || !current || chosen === '') throw new Error('forbidden');
      await repository.markReconciled(current.id, { category: chosen, note, confirmSerious: serious ? confirm : undefined }, user.id);
      closeException();
    });

  return { status, reload, busy, board, tab, setTab, runDetail, runLoading, runParam, openRun, closeRun, current, openException, closeException, category, setCategory, chosen, note, setNote, confirm, setConfirm, serious, needed, canSubmit, runNow, setFeed, reconcile };
}
