import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { AccessPackageView, ConsentRegisterFilter, ConsentRegisterView, DataRequestInput, DataRequestListView, DataRequestView, DeletionPlanResult, FulfilInput, PrivacyPolicyInput, PrivacyPolicyView, RetentionPreview, RetentionSaveInput, RetentionView, SubjectDetailView, SubjectRowView } from '@/data/repository';
import type { Purpose, RequestChannel, RequestType, RetentionRules, VerifyMethod } from '@/features/privacy/privacy';
import { POLL_MS } from './data-privacy-consent.types';

export type PrivacyState = ReturnType<typeof useDataPrivacyConsent>;
type Result<T = undefined> = { ok: true; value: T } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
export const TABS = ['register', 'requests', 'retention', 'policy'] as const;
export type PrivacyTab = (typeof TABS)[number];
const PAGE = 25;

/** Screen 194. Each tab reads its own part of the privacy record; every change is judged and recorded by the repository, then the views are read again. */
export function useDataPrivacyConsent() {
  const repository = useData();
  const { user } = useSession();
  const uid = user?.id ?? '';
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as PrivacyTab | null;
  const tab: PrivacyTab = tabParam && (TABS as readonly string[]).includes(tabParam) ? tabParam : 'register';
  const requestId = params.get('request') ?? '';
  const subjectId = params.get('subject') ?? '';
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const [rf, setRf] = useState<ConsentRegisterFilter>({ q: '', kind: 'all', purpose: null, status: null });
  const [register, setRegister] = useState<ConsentRegisterView | null>(null);
  const [rows, setRows] = useState<SubjectRowView[]>([]);
  const loadRegister = useCallback(async (f: ConsentRegisterFilter, offset: number) => {
    if (!uid) return;
    try { const v = await repository.getConsentRegister(uid, { ...f, offset, limit: PAGE }); if (!alive.current) return; setRegister(v); setRows((old) => (offset === 0 ? v.rows : [...old, ...v.rows.filter((r) => !old.some((o) => o.id === r.id))])); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid]);
  useEffect(() => { const id = window.setTimeout(() => { void loadRegister(rf, 0); }, rf.q ? 250 : 0); return () => window.clearTimeout(id); }, [rf, loadRegister]);

  const [rq, setRq] = useState<{ status: 'open' | 'closed' | 'all'; type: RequestType | 'all'; q: string }>({ status: 'open', type: 'all', q: '' });
  const [requests, setRequests] = useState<DataRequestListView | null>(null);
  const loadRequests = useCallback(async () => { if (!uid) return; try { const v = await repository.listDataRequests(uid, { status: rq.status, type: rq.type, q: rq.q, limit: 100 }); if (alive.current) setRequests(v); } catch { /* shown as empty */ } }, [repository, uid, rq]);
  useEffect(() => { void loadRequests(); }, [loadRequests]);
  const [counts, setCounts] = useState<DataRequestListView['counts'] | null>(null);
  const loadCounts = useCallback(async () => { if (!uid) return; try { const v = await repository.listDataRequests(uid, { status: 'all', limit: 1 }); if (alive.current) setCounts(v.counts); } catch { /* ignore */ } }, [repository, uid]);

  const [request, setRequest] = useState<DataRequestView | null>(null);
  const loadRequest = useCallback(async (id: string) => { if (!uid || !id) { setRequest(null); return; } try { const v = await repository.getDataRequest(uid, id); if (alive.current) setRequest(v); } catch { if (alive.current) setRequest(null); } }, [repository, uid]);
  useEffect(() => { void loadRequest(requestId); }, [requestId, loadRequest]);

  const [subject, setSubject] = useState<SubjectDetailView | null>(null);
  const loadSubject = useCallback(async (id: string) => { if (!uid || !id) { setSubject(null); return; } try { const v = await repository.getPrivacySubject(uid, id); if (alive.current) setSubject(v); } catch { if (alive.current) setSubject(null); } }, [repository, uid]);
  useEffect(() => { void loadSubject(subjectId); }, [subjectId, loadSubject]);

  const [retention, setRetention] = useState<RetentionView | null>(null);
  const loadRetention = useCallback(async () => { if (!uid) return; try { const v = await repository.getRetention(uid); if (alive.current) setRetention(v); } catch { /* ignore */ } }, [repository, uid]);
  const [policy, setPolicy] = useState<PrivacyPolicyView | null>(null);
  const loadPolicy = useCallback(async () => { if (!uid) return; try { const v = await repository.getPrivacyPolicy(uid); if (alive.current) setPolicy(v); } catch { /* ignore */ } }, [repository, uid]);

  const refreshAll = useCallback(async () => { await Promise.all([loadRegister(rf, 0), loadRequests(), loadCounts(), loadRetention(), loadPolicy(), requestId ? loadRequest(requestId) : Promise.resolve(), subjectId ? loadSubject(subjectId) : Promise.resolve()]); }, [loadRegister, rf, loadRequests, loadCounts, loadRetention, loadPolicy, requestId, loadRequest, subjectId, loadSubject]);
  useEffect(() => {
    void loadCounts(); void loadRetention(); void loadPolicy();
    const id = window.setInterval(() => { void loadCounts(); void loadRequests(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') { void loadCounts(); void loadRequests(); } };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [loadCounts, loadRetention, loadPolicy, loadRequests]);

  const act = async <T,>(fn: () => Promise<T>): Promise<Result<T>> => {
    setBusy(true);
    try { const value = await fn(); void refreshAll(); return { ok: true, value }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  const patch = (changes: Record<string, string | null>) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(changes)) { if (v) n.set(k, v); else n.delete(k); } return n; }, { replace: true });

  return {
    load, offline, busy, tab, requestId, subjectId, register, rows, rf, setRf, counts,
    refresh: refreshAll,
    setTab: (id: PrivacyTab) => patch({ tab: id === 'register' ? null : id }),
    moreRows: () => loadRegister(rf, rows.length),
    requests, rq, setRq, request,
    openRequest: (id: string | null) => patch(id ? { request: id, tab: 'requests', subject: null } : { request: null }),
    subject, openSubject: (id: string | null) => patch({ subject: id }),
    retention, policy,
    recordConsent: (sid: string, purpose: Purpose, status: 'granted' | 'withdrawn', note: string) => act(() => repository.recordConsent(uid, { subjectId: sid, purpose, status, note }).then((v) => { setSubject(v); return v; })),
    searchSubjects: (q: string) => repository.getConsentRegister(uid, { q, limit: 8 }).then((v) => v.rows).catch(() => [] as SubjectRowView[]),
    createRequest: (input: DataRequestInput) => act(() => repository.createDataRequest(uid, input)),
    verify: (id: string, method: VerifyMethod, note: string) => act(() => repository.verifyDataRequest(uid, id, method, note).then((v) => { setRequest(v); return v; })),
    plan: (id: string) => act<DeletionPlanResult>(() => repository.planDataRequest(uid, id)),
    accessPackage: (id: string) => act<AccessPackageView>(() => repository.getAccessPackage(uid, id)),
    fulfil: (id: string, input: FulfilInput) => act(() => repository.fulfilDataRequest(uid, id, input).then((v) => { setRequest(v); return v; })),
    refuse: (id: string, reason: string) => act(() => repository.refuseDataRequest(uid, id, reason).then((v) => { setRequest(v); return v; })),
    withdraw: (id: string, note: string) => act(() => repository.withdrawDataRequest(uid, id, note).then((v) => { setRequest(v); return v; })),
    previewRetention: (rules: RetentionRules, effectiveFrom: string | null) => repository.previewRetention(uid, rules, effectiveFrom).then((value) => ({ ok: true, value }) as Result<RetentionPreview>).catch((e) => ({ ok: false, problem: problemOf(e) }) as Result<RetentionPreview>),
    saveRetention: (input: RetentionSaveInput) => act(() => repository.saveRetentionPolicy(uid, input).then((v) => { setRetention(v); return v; })),
    publishPolicy: (input: PrivacyPolicyInput) => act(() => repository.publishPrivacyPolicy(uid, input).then((v) => { setPolicy(v); return v; })),
    recordNotice: (versionId: string, how: RequestChannel, note: string) => act(() => repository.recordPolicyNotice(uid, versionId, how, note).then((v) => { setPolicy(v); return v; })),
  };
}
