import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { BackupConfigInput, BackupConfigPreview, BackupOverview, DatasetCountView, ExportFile, ExportInput, ExportListView, ExportPreview } from '@/data/repository';
import type { BackupConfig, BackupFailure } from '@/features/backup/backup';
import { EXPORTS_PAGE } from '@/features/backup/backup';
import { POLL_MS, RUNNING_POLL_MS } from './backup-export.types';

export type BackupState = ReturnType<typeof useBackupExport>;
type Result<T = undefined> = { ok: true; value: T } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
export const TABS = ['backups', 'exports'] as const;
export type BackupTab = (typeof TABS)[number];

/** Screen 196. The backup record and the export jobs are read from the repository; a long export keeps being built by every poll, so progress is real rather than animated. */
export function useBackupExport() {
  const repository = useData();
  const { user } = useSession();
  const uid = user?.id ?? '';
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as BackupTab | null;
  const tab: BackupTab = tabParam && (TABS as readonly string[]).includes(tabParam) ? tabParam : 'backups';
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const [overview, setOverview] = useState<BackupOverview | null>(null);
  const loadOverview = useCallback(async () => {
    if (!uid) return;
    try { const v = await repository.getBackupOverview(uid); if (!alive.current) return; setOverview(v); setOffline(false); setLoad('ready'); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid]);

  const [jobs, setJobs] = useState<ExportListView | null>(null);
  const [limit, setLimit] = useState(EXPORTS_PAGE);
  const loadJobs = useCallback(async () => { if (!uid) return; try { const v = await repository.listExports(uid, 0, limit); if (alive.current) setJobs(v); } catch { /* the last list stays */ } }, [repository, uid, limit]);
  const [counts, setCounts] = useState<DatasetCountView[]>([]);
  useEffect(() => { if (uid) void repository.getDatasetCounts(uid).then((v) => { if (alive.current) setCounts(v); }).catch(() => undefined); }, [repository, uid]);

  useEffect(() => {
    void loadOverview(); void loadJobs();
    const id = window.setInterval(() => { void loadOverview(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') { void loadOverview(); void loadJobs(); } };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [loadOverview, loadJobs]);
  const running = (jobs?.running ?? 0) > 0;
  useEffect(() => {
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') void loadJobs(); }, running ? RUNNING_POLL_MS : POLL_MS);
    return () => window.clearInterval(id);
  }, [loadJobs, running]);

  const act = async <T,>(fn: () => Promise<T>): Promise<Result<T>> => {
    setBusy(true);
    try { const value = await fn(); void loadOverview(); void loadJobs(); return { ok: true, value }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  const patch = (changes: Record<string, string | null>) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(changes)) { if (v) n.set(k, v); else n.delete(k); } return n; }, { replace: true });

  return {
    load, offline, busy, tab, overview, jobs, counts, running,
    refresh: async () => { await Promise.all([loadOverview(), loadJobs()]); },
    setTab: (id: BackupTab) => patch({ tab: id === 'backups' ? null : id }),
    moreJobs: () => setLimit((n) => n + EXPORTS_PAGE),
    runNow: () => act(() => repository.runBackupNow(uid).then((v) => { setOverview(v); return v; })),
    previewConfig: (config: BackupConfig) => repository.previewBackupConfig(uid, config).then((value) => ({ ok: true, value }) as Result<BackupConfigPreview>).catch((e) => ({ ok: false, problem: problemOf(e) }) as Result<BackupConfigPreview>),
    saveConfig: (input: BackupConfigInput) => act(() => repository.saveBackupConfig(uid, input).then((v) => { setOverview(v); return v; })),
    recordTest: (runId: string, outcome: 'ok' | 'problems', note: string) => act(() => repository.recordRestoreTest(uid, runId, outcome, note).then((v) => { setOverview(v); return v; })),
    setService: (state: 'working' | 'failing', reason: BackupFailure | null) => act(() => repository.setBackupService(uid, state, reason).then((v) => { setOverview(v); return v; })),
    previewExport: (input: ExportInput) => repository.previewExport(uid, input).then((value) => ({ ok: true, value }) as Result<ExportPreview>).catch((e) => ({ ok: false, problem: problemOf(e) }) as Result<ExportPreview>),
    createExport: (input: ExportInput) => act(() => repository.createExport(uid, input)),
    download: (id: string) => act<ExportFile>(() => repository.downloadExport(uid, id)),
    cancel: (id: string) => act(() => repository.cancelExport(uid, id).then((v) => { setJobs(v); return v; })),
  };
}
