import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { GstComplianceView, SupplierGstView } from '@/data/repository';
import type { DocFilter, GstComplianceStatus, GstTab } from './tax-gst-compliance.types';
import { POLL_MS } from './tax-gst-compliance.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export type TaxGstComplianceState = ReturnType<typeof useTaxGstCompliance>;

export function useTaxGstCompliance() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = searchParams.get('period');
  const supplierParam = searchParams.get('supplier');

  const [status, setStatus] = useState<GstComplianceStatus>('loading');
  const [view, setView] = useState<GstComplianceView | null>(null);
  const [busy, setBusy] = useState(false);
  const [period, setPeriod] = useState<string | null>(periodParam);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setView(await repository.getGstCompliance(period, user.id));
      setStatus('ready');
    } catch {
      // A failed refresh never blanks figures that are already showing.
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, period]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);
  const reload = () => {
    setStatus('loading');
    void load();
  };
  const changePeriod = (next: string) => {
    setPeriod(next);
    setSearchParams(next ? { period: next } : {}, { replace: true });
  };

  /* ---------------------------------------------------------------- tabs */
  const [tab, setTab] = useState<GstTab>(supplierParam ? 'suppliers' : 'reconcile');
  const [docFilter, setDocFilter] = useState<DocFilter>('all');
  const documents = useMemo(() => {
    const docs = view?.documents ?? [];
    switch (docFilter) {
      case 'output':
        return docs.filter((d) => d.side === 'output');
      case 'input':
        return docs.filter((d) => d.side === 'input');
      case 'at_risk':
        return docs.filter((d) => d.credit === 'at_risk');
      case 'pending_match':
        return docs.filter((d) => d.credit === 'pending_match');
      default:
        return docs;
    }
  }, [view, docFilter]);
  const docCounts = useMemo(() => {
    const docs = view?.documents ?? [];
    return {
      all: docs.length,
      output: docs.filter((d) => d.side === 'output').length,
      input: docs.filter((d) => d.side === 'input').length,
      at_risk: docs.filter((d) => d.credit === 'at_risk').length,
      pending_match: docs.filter((d) => d.credit === 'pending_match').length,
    };
  }, [view]);
  /** Tapping a card leads to the detail behind it. */
  const goTo = (t: GstTab, filter?: DocFilter) => {
    setTab(t);
    if (filter) setDocFilter(filter);
  };

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

  /* ------------------------------------------------------ supplier check */
  const [supplierId, setSupplierId] = useState<string | null>(supplierParam);
  const openSupplier = (id: string) => {
    setSupplierId(id);
    setSearchParams({ ...(view ? { period: view.period } : {}), supplier: id }, { replace: true });
  };
  const closeSupplier = () => {
    setSupplierId(null);
    setChecking(false);
    setSearchParams(view ? { period: view.period } : {}, { replace: true });
  };
  const supplier: SupplierGstView | null = useMemo(() => view?.suppliers.find((s) => s.supplierId === supplierId) ?? null, [view, supplierId]);
  const [checking, setChecking] = useState(false);
  const [standing, setStanding] = useState<'active' | 'suspended' | 'cancelled'>('active');
  const [lastReturn, setLastReturn] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [note, setNote] = useState('');
  const startCheck = () => {
    const c = supplier?.current;
    setStanding(c?.standing ?? 'active');
    setLastReturn(c?.lastReturnPeriod ?? '');
    setEffectiveFrom(c?.effectiveFrom ?? '');
    setNote('');
    setChecking(true);
  };
  const today = new Date().toISOString().slice(0, 10);
  const checkValid = standing === 'active' || (effectiveFrom !== '' && effectiveFrom <= today);
  const confirmCheck = () =>
    run(async () => {
      if (!user || !supplierId) throw new Error('forbidden');
      await repository.recordSupplierGstCheck(supplierId, { standing, lastReturnPeriod: lastReturn || null, effectiveFrom: standing === 'active' ? undefined : effectiveFrom, note }, user.id);
      setChecking(false);
    });

  /* ------------------------------------------------------------ handover */
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [handoverNote, setHandoverNote] = useState('');
  const openHandover = () => {
    setHandoverNote('');
    setHandoverOpen(true);
  };
  const confirmHandover = () =>
    run(async () => {
      if (!user || !view) throw new Error('forbidden');
      await repository.handOverGstPeriod(view.period, handoverNote, user.id);
      setHandoverOpen(false);
    });

  return {
    status,
    reload,
    busy,
    view,
    period: view?.period ?? period ?? '',
    changePeriod,
    tab,
    setTab,
    goTo,
    docFilter,
    setDocFilter,
    documents,
    docCounts,
    supplierId,
    supplier,
    openSupplier,
    closeSupplier,
    checking,
    standing,
    setStanding,
    lastReturn,
    setLastReturn,
    effectiveFrom,
    setEffectiveFrom,
    note,
    setNote,
    startCheck,
    setChecking,
    checkValid,
    confirmCheck,
    handoverOpen,
    setHandoverOpen,
    handoverNote,
    setHandoverNote,
    openHandover,
    confirmHandover,
  };
}
