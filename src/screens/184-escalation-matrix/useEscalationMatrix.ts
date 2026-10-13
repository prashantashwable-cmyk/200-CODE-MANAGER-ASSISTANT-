import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { EscalationBackupInput, EscalationMatrixView, EscalationScenarioInput, EscalationScenarioView } from '@/data/repository';
import type { EscalationRailState, User } from '@/data/types';
import { POLL_BUSY_MS, POLL_MS } from './escalation-matrix.types';

export type MatrixState = ReturnType<typeof useEscalationMatrix>;
type Result = { ok: true } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
const draftOf = (s: EscalationScenarioView): EscalationScenarioInput => ({ enabled: s.enabled, trigger: s.trigger, tiers: JSON.parse(JSON.stringify(s.tiers)), lastResort: { ...s.lastResort }, singlePointNote: s.singlePointNote });

/** Screen 184. The escalation chain per scenario, the people who back Admin up, and drills: all edits are drafts until saved, and a drill is polled while it runs. */
export function useEscalationMatrix() {
  const repository = useData();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const scenarioId = params.get('scenario') ?? '';
  const drillId = params.get('drill') ?? '';
  const runId = params.get('run') ?? '';
  const contact = Number(params.get('contact') ?? '0');
  const [view, setView] = useState<EscalationMatrixView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<EscalationScenarioInput | null>(null);
  const [people, setPeople] = useState<User[]>([]);
  const loadedFor = useRef('');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try { const v = await repository.getEscalationMatrix(user.id); if (!alive.current) return; setView(v); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, user]);
  const busyNow = !!view && (view.drills.some((d) => d.status === 'running') || view.totals.runningNow > 0);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, busyNow ? POLL_BUSY_MS : POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read, busyNow]);
  useEffect(() => { void repository.listUsers({ status: 'active' }).then((u) => { if (alive.current) setPeople(u.filter((x) => x.role !== 'customer' && x.role !== 'supplier' && x.id !== user?.id)); }).catch(() => undefined); }, [repository, user?.id]);

  const scenario = view?.scenarios.find((s) => s.id === scenarioId) ?? null;
  useEffect(() => {
    if (!scenario) { loadedFor.current = ''; setDraft(null); return; }
    const key = `${scenario.id}|${scenario.version}`;
    if (loadedFor.current !== key) { loadedFor.current = key; setDraft(draftOf(scenario)); }
  }, [scenario]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  const act = async <T,>(fn: () => Promise<T>, after?: (v: T) => void): Promise<Result> => {
    setBusy(true);
    try { const v = await fn(); after?.(v); await read(); return { ok: true }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  const uid = user?.id ?? '';
  return {
    load, offline, view, busy, people, scenario, scenarioId, drillId, runId, contact, draft,
    drill: view?.drills.find((d) => d.id === drillId) ?? null,
    refresh: read,
    openScenario: (id: string | null) => patch((n) => { if (id) n.set('scenario', id); else n.delete('scenario'); }),
    openDrill: (id: string | null) => patch((n) => { if (id) n.set('drill', id); else n.delete('drill'); }),
    openRun: (id: string | null) => patch((n) => { if (id) n.set('run', id); else n.delete('run'); }),
    openContact: (slot: number | null) => patch((n) => { if (slot) n.set('contact', String(slot)); else n.delete('contact'); }),
    edit: (next: Partial<EscalationScenarioInput>) => setDraft((d) => (d ? { ...d, ...next } : d)),
    revert: () => { if (scenario) setDraft(draftOf(scenario)); },
    save: (): Promise<Result> => act(() => repository.saveEscalationScenario(uid, scenarioId, draft as EscalationScenarioInput)),
    saveBackup: (slot: number, input: EscalationBackupInput | null): Promise<Result> => act(() => repository.saveEscalationBackup(uid, slot, input)),
    setRail: (target: string, channel: 'sms' | 'call', state: EscalationRailState): Promise<Result> => act(() => repository.setEscalationRail(uid, target, channel, state)),
    startDrill: (id: string): Promise<Result> => act(() => repository.startEscalationDrill(uid, id), (d) => patch((n) => { n.set('drill', d.id); })),
    confirmStep: (drill: string, step: string): Promise<Result> => act(() => repository.confirmEscalationDrillStep(uid, drill, step)),
    acceptGap: (drill: string, note: string): Promise<Result> => act(() => repository.acceptEscalationGap(uid, drill, note)),
  };
}
