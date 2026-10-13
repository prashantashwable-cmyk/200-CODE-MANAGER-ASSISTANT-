import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CustomRuleActivateOptions, CustomRuleSimulation, CustomRulesView, CustomRuleView } from '@/data/repository';
import { STARTERS, complexityOf, conflictsOf, draftProblems, emptyDraft } from '@/features/automation/customRules';
import type { RecordValues, RuleDraft } from '@/features/automation/customRules';
import { LIST_ROUTE, POLL_MS, draftKey, ruleRoute } from './workflow-rules.types';

export type WorkflowState = ReturnType<typeof useWorkflowRules>;
function readJson<T>(key: string, fallback: T): T { try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v ?? fallback; } catch { return fallback; } }
function writeJson(key: string, value: unknown): void { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* the phone may refuse; the screen still works */ } }
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
type Result = { ok: true } | { ok: false; problem: string };
const draftOf = (r: CustomRuleView): RuleDraft => ({ name: r.name, subject: r.subject, logic: r.logic, conditions: r.conditions.map((c) => ({ ...c })), action: { ...r.action } });

/** Screen 182. The library of custom rules and the plain-language builder: a draft kept on the phone, live checks from the same rules the repository applies, a test on real or sample records, and activation that asks for exactly what it needs. */
export function useWorkflowRules() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { ruleId = '' } = useParams<{ ruleId?: string }>();
  const [params, setParams] = useSearchParams();
  const filter = params.get('f') ?? 'active';
  const starterId = params.get('starter') ?? '';
  const [view, setView] = useState<CustomRulesView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sim, setSim] = useState<CustomRuleSimulation | null>(null);
  const [restored, setRestored] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try { const v = await repository.listCustomRules(user.id); if (!alive.current) return; setView(v); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, user]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read]);

  const rule: CustomRuleView | null = ruleId && ruleId !== 'new' ? view?.rules.find((r) => r.id === ruleId) ?? null : null;
  const editing = !!ruleId;
  const [draft, setDraftState] = useState<RuleDraft>(emptyDraft());
  const loadedFor = useRef('');
  useEffect(() => {
    if (!editing || !user) return;
    const key = `${ruleId}|${rule?.version ?? 0}`;
    if (ruleId === 'new') {
      if (loadedFor.current === 'new') return;
      loadedFor.current = 'new';
      const starter = STARTERS.find((s) => s.id === starterId);
      if (starter) { setDraftState({ ...starter.draft, name: t(`workflowRules.starter.${starter.id}.name`), conditions: starter.draft.conditions.map((c) => ({ ...c })), action: { ...starter.draft.action } }); return; }
      const saved = readJson<RuleDraft | null>(draftKey(user.id, 'new'), null);
      if (saved) { setDraftState(saved); setRestored(true); } else setDraftState(emptyDraft());
      return;
    }
    if (rule && loadedFor.current !== key) { loadedFor.current = key; setDraftState(draftOf(rule)); setSim(null); }
  }, [editing, ruleId, rule, user, starterId, t]);

  const setDraft = (next: RuleDraft) => { setDraftState(next); setSim(null); if (user && (ruleId === 'new' || rule)) writeJson(draftKey(user.id, ruleId || 'new'), next); };
  const others = (view?.rules ?? []).filter((r) => r.status !== 'retired' && r.id !== rule?.id).map((r) => ({ id: r.id, draft: draftOf(r) }));
  const problems = useMemo(() => draftProblems(draft), [draft]);
  const conflicts = useMemo(() => conflictsOf(draft, others), [draft, view, rule?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const complexity = complexityOf(draft);
  const locked = !!rule && (rule.status === 'active' || rule.status === 'retired');
  const setParam = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  const act = async <T,>(fn: () => Promise<T>, after?: (v: T) => void): Promise<Result> => {
    setBusy(true);
    try { const v = await fn(); after?.(v); await read(); return { ok: true }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  return {
    load, offline, view, rule, ruleId, editing, filter, draft, problems, conflicts, complexity, locked, busy, sim, restored,
    refresh: read,
    setFilter: (f: string) => setParam((n) => { n.set('f', f); }),
    setDraft,
    openRule: (id: string) => navigate(ruleRoute(id)),
    newRule: (starter?: string) => navigate(`${ruleRoute('new')}${starter ? `?starter=${starter}` : ''}`),
    toList: () => navigate(LIST_ROUTE),
    save: (): Promise<Result> => act(() => repository.saveCustomRule(user?.id ?? '', rule?.id ?? null, draft), (saved) => { if (user) try { localStorage.removeItem(draftKey(user.id, 'new')); } catch { /* nothing to clear */ } if (!rule) { loadedFor.current = ''; navigate(ruleRoute(saved.id), { replace: true }); } }),
    test: (sample: RecordValues | null): Promise<Result> => act(() => repository.simulateCustomRule(user?.id ?? '', draft, rule?.id ?? null, sample), (r) => setSim(r)),
    activate: (o: CustomRuleActivateOptions): Promise<Result> => act(() => repository.activateCustomRule(user?.id ?? '', rule?.id ?? '', o)),
    pause: (): Promise<Result> => act(() => repository.pauseCustomRule(user?.id ?? '', rule?.id ?? '')),
    retire: (reason: string): Promise<Result> => act(() => repository.retireCustomRule(user?.id ?? '', rule?.id ?? '', reason)),
    copy: (id: string): Promise<Result> => act(() => repository.copyCustomRule(user?.id ?? '', id), (c) => navigate(ruleRoute(c.id))),
    pauseId: (id: string): Promise<Result> => act(() => repository.pauseCustomRule(user?.id ?? '', id)),
  };
}
