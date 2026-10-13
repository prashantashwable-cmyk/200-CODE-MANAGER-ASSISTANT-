import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CustomRoleInput, MatrixRowView, PermissionLogView, PermissionMatrixView, PermissionOverview, PermissionUserRow, RoleChangeInput, RoleChangePreview, UserAccessView, UserOverrideInput } from '@/data/repository';
import type { PermissionChange, PermissionChangeKind } from '@/data/types';
import { ACCESS_CHANGED, useAccess } from '@/features/access/AccessContext';
import { PAGE } from '@/features/access/permissions';
import { POLL_MS } from './user-role-permissions.types';

export type PermissionsState = ReturnType<typeof useUserRolePermissions>;
type Result<T = undefined> = { ok: true; value: T } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
export const TABS = ['matrix', 'roles', 'users', 'audit'] as const;
export type PermissionTab = (typeof TABS)[number];
export interface MatrixFilter { q: string; module: number | null; changed: boolean; adminOnly: boolean }
export interface AuditFilter { q: string; kind: PermissionChangeKind | 'all' }

/** Screen 192. The table of screens comes from the app itself; what is read here is only Admin's decisions against it. A change is judged and recorded by the repository, then every view is read again. */
export function useUserRolePermissions() {
  const repository = useData();
  const { user } = useSession();
  const access = useAccess();
  const { t } = useTranslation();
  const uid = user?.id ?? '';
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as PermissionTab | null;
  const tab: PermissionTab = tabParam && (TABS as readonly string[]).includes(tabParam) ? tabParam : 'matrix';
  const entryId = params.get('entry') ?? '';
  const openUserId = params.get('user') ?? '';
  const [overview, setOverview] = useState<PermissionOverview | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  // The matrix: filters, the rows read so far, and how many there are.
  const [mf, setMf] = useState<MatrixFilter>({ q: '', module: null, changed: false, adminOnly: false });
  const [matrix, setMatrix] = useState<PermissionMatrixView | null>(null);
  const [rows, setRows] = useState<MatrixRowView[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const idsFor = useCallback((q: string): string[] | undefined => {
    const w = q.trim().toLowerCase();
    if (!w) return undefined;
    return access.screens.filter((s) => s.id.includes(w) || s.path.toLowerCase().includes(w) || t(s.titleKey, { defaultValue: s.titleKey }).toLowerCase().includes(w)).map((s) => s.id);
  }, [access.screens, t]);
  const loadMatrix = useCallback(async (filter: MatrixFilter, offset: number) => {
    if (!uid) return;
    setMatrixLoading(true);
    try {
      await access.ready;
      const v = await repository.getPermissionMatrix(uid, { ids: idsFor(filter.q), module: filter.module, changed: filter.changed, adminOnly: filter.adminOnly, offset, limit: PAGE });
      if (!alive.current) return;
      setMatrix(v);
      setRows((old) => (offset === 0 ? v.rows : [...old, ...v.rows.filter((r) => !old.some((o) => o.id === r.id))]));
    } catch { /* the overview carries the error state */ } finally { if (alive.current) setMatrixLoading(false); }
  }, [repository, uid, access.ready, idsFor]);
  const mfRef = useRef(mf);
  mfRef.current = mf;
  useEffect(() => { const id = window.setTimeout(() => { void loadMatrix(mf, 0); }, mf.q ? 250 : 0); return () => window.clearTimeout(id); }, [mf, loadMatrix]);

  // People.
  const [uq, setUq] = useState('');
  const [people, setPeople] = useState<PermissionUserRow[] | null>(null);
  const [detail, setDetail] = useState<UserAccessView | null>(null);
  const loadPeople = useCallback(async (q: string) => { if (!uid) return; try { await access.ready; const v = await repository.listPermissionUsers(uid, q); if (alive.current) setPeople(v); } catch { /* shown as empty */ } }, [repository, uid, access.ready]);
  useEffect(() => { const id = window.setTimeout(() => { void loadPeople(uq); }, uq ? 250 : 0); return () => window.clearTimeout(id); }, [uq, loadPeople]);
  const loadDetail = useCallback(async (id: string) => { if (!uid || !id) { setDetail(null); return; } try { await access.ready; const v = await repository.getUserAccess(uid, id); if (alive.current) setDetail(v); } catch { if (alive.current) setDetail(null); } }, [repository, uid, access.ready]);
  useEffect(() => { void loadDetail(openUserId); }, [openUserId, loadDetail]);

  // The audit trail.
  const [af, setAf] = useState<AuditFilter>({ q: '', kind: 'all' });
  const [log, setLog] = useState<PermissionLogView | null>(null);
  const [entries, setEntries] = useState<PermissionChange[]>([]);
  const loadLog = useCallback(async (filter: AuditFilter, offset: number) => {
    if (!uid) return;
    try {
      await access.ready;
      const v = await repository.getPermissionLog(uid, { q: filter.q, kind: filter.kind, offset, limit: PAGE });
      if (!alive.current) return;
      setLog(v);
      setEntries((old) => (offset === 0 ? v.entries : [...old, ...v.entries.filter((e) => !old.some((o) => o.id === e.id))]));
    } catch { /* shown as empty */ }
  }, [repository, uid, access.ready]);
  useEffect(() => { const id = window.setTimeout(() => { void loadLog(af, 0); }, af.q ? 250 : 0); return () => window.clearTimeout(id); }, [af, loadLog]);

  const readOverview = useCallback(async () => {
    if (!uid) return;
    try { await access.ready; const v = await repository.getPermissionOverview(uid); if (!alive.current) return; setOverview(v); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid, access.ready]);
  useEffect(() => {
    void readOverview();
    const id = window.setInterval(() => { void readOverview(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void readOverview(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [readOverview]);

  const refreshAll = useCallback(async () => {
    await Promise.all([readOverview(), loadMatrix(mfRef.current, 0), loadPeople(uq), loadLog(af, 0), openUserId ? loadDetail(openUserId) : Promise.resolve()]);
  }, [readOverview, loadMatrix, loadPeople, loadLog, uq, af, openUserId, loadDetail]);

  const act = async <T,>(fn: () => Promise<T>): Promise<Result<T>> => {
    setBusy(true);
    try { const value = await fn(); window.dispatchEvent(new Event(ACCESS_CHANGED)); void refreshAll(); return { ok: true, value }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  const patch = (changes: Record<string, string | null>) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(changes)) { if (v) n.set(k, v); else n.delete(k); } return n; }, { replace: true });

  return {
    load, offline, busy, overview, tab, entryId, openUserId, screens: access.screens,
    refresh: refreshAll,
    setTab: (id: PermissionTab) => patch({ tab: id === 'matrix' ? null : id }),
    // matrix
    matrix, rows, matrixLoading, mf, setMf,
    moreRows: () => loadMatrix(mf, rows.length),
    // people
    people, uq, setUq, detail,
    openUser: (id: string | null) => patch({ user: id, tab: id ? 'users' : null }),
    // audit
    entries, log, af, setAf, moreEntries: () => loadLog(af, entries.length),
    // actions
    preview: (input: RoleChangeInput) => repository.previewRoleChange(uid, input).then((value) => ({ ok: true, value }) as Result<RoleChangePreview>).catch((e) => ({ ok: false, problem: problemOf(e) }) as Result<RoleChangePreview>),
    changeRole: (input: RoleChangeInput) => act(() => repository.changeRolePermission(uid, input)),
    createRole: (input: CustomRoleInput) => act(() => repository.createCustomRole(uid, input)),
    retireRole: (id: string, reason: string) => act(() => repository.retireCustomRole(uid, id, reason)),
    assignRole: (target: string, roleId: string, assign: boolean, reason: string) => act(() => repository.assignUserRole(uid, target, roleId, assign, reason).then((v) => { setDetail(v); return v; })),
    setOverride: (input: UserOverrideInput) => act(() => repository.setUserOverride(uid, input).then((v) => { setDetail(v); return v; })),
    removeOverride: (id: string, reason: string) => act(() => repository.removeUserOverride(uid, id, reason).then((v) => { setDetail(v); return v; })),
    reviewOverride: (id: string, note: string) => act(() => repository.reviewUserOverride(uid, id, note).then((v) => { setDetail(v); return v; })),
  };
}
