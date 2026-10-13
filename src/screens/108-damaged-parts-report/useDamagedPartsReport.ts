import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DiscrepancyReportView } from '@/data/repository';
import type { DefectAttribution, ReportResolution } from '@/data/types';
import type { DamagedPartsStatus, ReportFilter } from './damaged-parts-report.types';
import { POLL_MS } from './damaged-parts-report.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
  skipped?: 'opted_out' | 'no_contact' | 'already_told';
  logged?: boolean;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export interface HappenedDraft {
  causes: DefectAttribution[];
  note: string;
  rush: boolean;
  neededBy: string;
}

export type DamagedPartsState = ReturnType<typeof useDamagedPartsReport>;

export function useDamagedPartsReport() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const reportParam = searchParams.get('report');

  const [status, setStatus] = useState<DamagedPartsStatus>('loading');
  const [reports, setReports] = useState<DiscrepancyReportView[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setReports(await repository.getDiscrepancyReports(user.id));
      setStatus('ready');
    } catch {
      // A failed refresh never blanks a board that is already showing.
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

  const isAdmin = user?.role === 'admin';

  /* --------------------------------------------------------- filter + search */
  const [filter, setFilter] = useState<ReportFilter>('open');
  const [query, setQuery] = useState('');
  const counts = useMemo(
    () => ({
      open: reports.filter((r) => r.status === 'open').length,
      unjudged: reports.filter((r) => r.status === 'open' && !r.attribution).length,
      rush: reports.filter((r) => r.status === 'open' && r.rush).length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
    }),
    [reports],
  );
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports
      .filter((r) => (filter === 'open' ? r.status === 'open' : filter === 'unjudged' ? r.status === 'open' && !r.attribution : filter === 'rush' ? r.status === 'open' && r.rush : r.status === 'resolved'))
      .filter((r) => !q || [r.code, r.poCode, r.siteName, r.supplierName, r.customerName].some((v) => v.toLowerCase().includes(q)));
  }, [reports, filter, query]);

  /* ---------------------------------------------------------------- the detail */
  const current = useMemo(() => reports.find((r) => r.id === reportParam) ?? null, [reports, reportParam]);
  const openReport = (id: string) => setSearchParams({ report: id });
  const closeReport = () => setSearchParams({});

  const run = async (fn: () => Promise<ActionResult | void>): Promise<ActionResult> => {
    setBusy(true);
    try {
      const out = (await fn()) ?? { ok: true };
      await load();
      return out;
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------- what happened (any role) */
  const [happened, setHappened] = useState<Record<string, HappenedDraft>>({});
  const happenedOf = (r: DiscrepancyReportView): HappenedDraft =>
    happened[r.id] ?? { causes: r.possibleCauses, note: r.causeNote ?? '', rush: r.rush, neededBy: r.neededBy ? r.neededBy.slice(0, 10) : '' };
  const patchHappened = (r: DiscrepancyReportView, patch: Partial<HappenedDraft>) => setHappened((cur) => ({ ...cur, [r.id]: { ...happenedOf(r), ...patch } }));
  const happenedDirty = (r: DiscrepancyReportView) => {
    const d = happened[r.id];
    return !!d && (d.note !== (r.causeNote ?? '') || d.rush !== r.rush || d.neededBy !== (r.neededBy ? r.neededBy.slice(0, 10) : '') || [...d.causes].sort().join() !== [...r.possibleCauses].sort().join());
  };
  const saveHappened = (r: DiscrepancyReportView) =>
    run(async () => {
      if (!user) return { ok: false, code: 'forbidden' };
      const d = happenedOf(r);
      await repository.updateDiscrepancyReport(r.id, { possibleCauses: d.causes, causeNote: d.note.trim() || undefined, rush: d.rush, neededBy: d.rush && d.neededBy ? d.neededBy : undefined }, user.id);
      setHappened((cur) => {
        const next = { ...cur };
        delete next[r.id];
        return next;
      });
      return { ok: true };
    });

  /* --------------------------------------------------------- Admin's judgement */
  const [judgeDraft, setJudgeDraft] = useState<Record<string, { attribution: DefectAttribution | ''; note: string }>>({});
  const judgeOf = (r: DiscrepancyReportView) => judgeDraft[r.id] ?? { attribution: r.attribution ?? '', note: r.attributionNote ?? '' };
  const patchJudge = (r: DiscrepancyReportView, patch: Partial<{ attribution: DefectAttribution | ''; note: string }>) => setJudgeDraft((cur) => ({ ...cur, [r.id]: { ...judgeOf(r), ...patch } }));
  const [changingJudgement, setChangingJudgement] = useState<string | null>(null);
  const saveJudgement = (r: DiscrepancyReportView) =>
    run(async () => {
      const d = judgeOf(r);
      if (!user || !d.attribution) return { ok: false, code: 'invalid_input' };
      await repository.attributeDiscrepancyReport(r.id, { attribution: d.attribution, note: d.note }, user.id);
      setChangingJudgement(null);
      return { ok: true };
    });

  /* ----------------------------------------------------------- resolution path */
  const [track, setTrack] = useState<Record<string, { eta: string; credit: string; note: string }>>({});
  const trackOf = (r: DiscrepancyReportView) => track[r.id] ?? { eta: r.replacementEta ? r.replacementEta.slice(0, 10) : '', credit: r.creditAmount ? String(r.creditAmount) : '', note: '' };
  const patchTrack = (r: DiscrepancyReportView, patch: Partial<{ eta: string; credit: string; note: string }>) => setTrack((cur) => ({ ...cur, [r.id]: { ...trackOf(r), ...patch } }));
  const advance = (r: DiscrepancyReportView, resolution: ReportResolution) =>
    run(async () => {
      if (!user) return { ok: false, code: 'forbidden' };
      const d = trackOf(r);
      await repository.advanceDiscrepancyResolution(
        r.id,
        {
          resolution,
          replacementEta: d.eta ? d.eta : undefined,
          creditAmount: resolution === 'credited' ? Number(d.credit) : undefined,
          note: d.note.trim() || undefined,
        },
        user.id,
      );
      setTrack((cur) => {
        const next = { ...cur };
        delete next[r.id];
        return next;
      });
      return { ok: true };
    });

  /* -------------------------------------------------------- supplier + customer */
  const sendToSupplier = (r: DiscrepancyReportView, channel: 'in_app' | 'phone' | 'email' | 'whatsapp' | 'in_person') =>
    run(async () => {
      if (!user) return { ok: false, code: 'forbidden' };
      await repository.sendReportToSupplier(r.id, channel, user.id);
      return { ok: true, logged: channel !== 'in_app' };
    });
  const tellCustomer = (r: DiscrepancyReportView) =>
    run(async () => {
      if (!user) return { ok: false, code: 'forbidden' };
      const out = await repository.notifyCustomerOfReport(r.id, user.id);
      return { ok: out.notified, skipped: out.skipped };
    });

  return {
    status,
    reload,
    busy,
    isAdmin,
    reports,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    shown,
    current,
    reportParam,
    openReport,
    closeReport,
    happenedOf,
    patchHappened,
    happenedDirty,
    saveHappened,
    judgeOf,
    patchJudge,
    changingJudgement,
    setChangingJudgement,
    saveJudgement,
    trackOf,
    patchTrack,
    advance,
    sendToSupplier,
    tellCustomer,
  };
}
