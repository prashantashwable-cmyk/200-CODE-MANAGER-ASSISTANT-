import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { AccountListFilter, AccountSecurityRow, AccountSecurityView, ExceptionDecisionInput, ExceptionGrantInput, LostDeviceInput, RecoveryIssued, RecoveryStartInput, SecFilterState, SecurityConfigPreview, SecurityConfigSaveInput, SecurityEventFilter, SecurityEventsView, SecurityOverview, SimulateSignInInput, TwoFactorExceptionList } from '@/data/repository';
import type { SecurityConfig } from '@/features/security/security';
import { readAuthSessionId } from '@/features/security/sessionKeys';
import { POLL_MS } from './security-session.types';

export type SecurityState = ReturnType<typeof useSecuritySession>;
type Result<T = undefined> = { ok: true; value: T } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
export const TABS = ['overview', 'accounts', 'events', 'exceptions', 'policy'] as const;
export type SecurityTab = (typeof TABS)[number];
const PAGE = 25;

/** Screen 195. Each tab reads its own part of the authentication record; every change is judged and recorded by the repository, then the views are read again. */
export function useSecuritySession() {
  const repository = useData();
  const { user } = useSession();
  const uid = user?.id ?? '';
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as SecurityTab | null;
  const tab: SecurityTab = tabParam && (TABS as readonly string[]).includes(tabParam) ? tabParam : 'overview';
  const accountId = params.get('account') ?? '';
  const exceptionId = params.get('exception') ?? '';
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const loadOverview = useCallback(async () => {
    if (!uid) return;
    try { const v = await repository.getSecurityOverview(uid); if (!alive.current) return; setOverview(v); setOffline(false); setLoad('ready'); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid]);

  const [af, setAf] = useState<{ q: string; role: AccountListFilter['role']; state: SecFilterState }>({ q: '', role: 'all', state: 'all' });
  const [rows, setRows] = useState<AccountSecurityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoad, setListLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadAccounts = useCallback(async (f: typeof af, offset: number) => {
    if (!uid) return;
    try { const v = await repository.listAccountSecurity(uid, { ...f, offset, limit: PAGE }); if (!alive.current) return; setTotal(v.total); setRows((old) => (offset === 0 ? v.rows : [...old, ...v.rows.filter((r) => !old.some((o) => o.userId === r.userId))])); setListLoad('ready'); }
    catch { if (alive.current) setListLoad('error'); }
  }, [repository, uid]);
  useEffect(() => { const id = window.setTimeout(() => { void loadAccounts(af, 0); }, af.q ? 250 : 0); return () => window.clearTimeout(id); }, [af, loadAccounts]);

  const [account, setAccount] = useState<AccountSecurityView | null>(null);
  const [accountLoad, setAccountLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadAccount = useCallback(async (id: string) => {
    if (!uid || !id) { setAccount(null); return; }
    try { const v = await repository.getAccountSecurity(uid, id, readAuthSessionId()); if (!alive.current) return; setAccount(v); setAccountLoad('ready'); } catch { if (alive.current) setAccountLoad('error'); }
  }, [repository, uid]);
  useEffect(() => { setAccountLoad('loading'); void loadAccount(accountId); }, [accountId, loadAccount]);

  const [ef, setEf] = useState<{ group: string; severity: SecurityEventFilter['severity']; flagged: boolean; q: string }>({ group: 'all', severity: 'all', flagged: false, q: '' });
  const [events, setEvents] = useState<SecurityEventsView | null>(null);
  const [evLoad, setEvLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const evAccount = params.get('evaccount') ?? '';
  const loadEvents = useCallback(async (f: typeof ef, offset: number) => {
    if (!uid) return;
    try { const v = await repository.getSecurityEvents(uid, { group: f.group, severity: f.severity, flagged: f.flagged, q: f.q, accountId: evAccount || undefined, offset, limit: PAGE }); if (!alive.current) return; setEvents((old) => (offset === 0 || !old ? v : { ...v, rows: [...old.rows, ...v.rows.filter((r) => !old.rows.some((o) => o.id === r.id))] })); setEvLoad('ready'); }
    catch { if (alive.current) setEvLoad('error'); }
  }, [repository, uid, evAccount]);
  useEffect(() => { const id = window.setTimeout(() => { void loadEvents(ef, 0); }, ef.q ? 250 : 0); return () => window.clearTimeout(id); }, [ef, loadEvents]);

  const [showAllEx, setShowAllEx] = useState(false);
  const [exceptions, setExceptions] = useState<TwoFactorExceptionList | null>(null);
  const loadExceptions = useCallback(async () => { if (!uid) return; try { const v = await repository.listTwoFactorExceptions(uid, showAllEx ? 'all' : 'open'); if (alive.current) setExceptions(v); } catch { /* ignore */ } }, [repository, uid, showAllEx]);
  useEffect(() => { void loadExceptions(); }, [loadExceptions]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadOverview(), loadAccounts(af, 0), loadEvents(ef, 0), loadExceptions(), accountId ? loadAccount(accountId) : Promise.resolve()]);
  }, [loadOverview, loadAccounts, loadEvents, loadExceptions, loadAccount, af, ef, accountId]);
  useEffect(() => {
    void loadOverview();
    const id = window.setInterval(() => { void loadOverview(); void loadExceptions(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') { void loadOverview(); void loadExceptions(); } };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [loadOverview, loadExceptions]);

  const act = async <T,>(fn: () => Promise<T>): Promise<Result<T>> => {
    setBusy(true);
    try { const value = await fn(); void refreshAll(); return { ok: true, value }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  const patch = (changes: Record<string, string | null>) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(changes)) { if (v) n.set(k, v); else n.delete(k); } return n; }, { replace: true });
  const keepAccount = (v: AccountSecurityView): AccountSecurityView => { setAccount(v); return v; };

  return {
    load, offline, busy, tab, accountId, exceptionId, overview, refresh: refreshAll,
    setTab: (id: SecurityTab) => patch({ tab: id === 'overview' ? null : id, account: null, exception: null }),
    af, setAf, rows, total, listLoad, moreRows: () => loadAccounts(af, rows.length), retryList: () => loadAccounts(af, 0),
    account, accountLoad, openAccount: (id: string | null) => patch(id ? { account: id, tab: 'accounts' } : { account: null }),
    events, evLoad, ef, setEf, evAccount, setEvAccount: (id: string | null) => patch({ evaccount: id }), moreEvents: () => loadEvents(ef, events?.rows.length ?? 0), retryEvents: () => loadEvents(ef, 0),
    exceptions, showAllEx, setShowAllEx, openException: (id: string | null) => patch({ exception: id }),
    currentSessionId: readAuthSessionId(),
    revoke: (sessionId: string, reason: string) => act(() => repository.revokeSession(uid, sessionId, reason).then(keepAccount)),
    revokeOthers: (id: string, reason: string, keep: string | null) => act(() => repository.revokeOtherSessions(uid, id, reason, keep).then(keepAccount)),
    lost: (input: LostDeviceInput) => act(() => repository.reportDeviceLost(uid, input).then(keepAccount)),
    startRecovery: (input: RecoveryStartInput) => act<RecoveryIssued>(() => repository.startAccountRecovery(uid, input)),
    cancelRecovery: (id: string, note: string) => act(() => repository.cancelAccountRecovery(uid, id, note).then(keepAccount)),
    confirmPlace: (sessionId: string, verdict: 'me' | 'not_me', note: string) => act(() => repository.confirmSessionPlace(uid, sessionId, verdict, note).then(keepAccount)),
    decide: (id: string, input: ExceptionDecisionInput) => act(() => repository.decideTwoFactorException(uid, id, input).then((v) => { setExceptions(v); return v; })),
    grant: (input: ExceptionGrantInput) => act(() => repository.grantTwoFactorException(uid, input).then((v) => { setExceptions(v); return v; })),
    endException: (id: string, note: string) => act(() => repository.endTwoFactorException(uid, id, note).then((v) => { setExceptions(v); return v; })),
    simulate: (input: SimulateSignInInput) => act(() => repository.simulateSignIn(uid, input).then(keepAccount)),
    previewConfig: (config: SecurityConfig) => repository.previewSecurityConfig(uid, config).then((value) => ({ ok: true, value }) as Result<SecurityConfigPreview>).catch((e) => ({ ok: false, problem: problemOf(e) }) as Result<SecurityConfigPreview>),
    saveConfig: (input: SecurityConfigSaveInput) => act(() => repository.saveSecurityConfig(uid, input).then((v) => { setOverview(v); return v; })),
  };
}
