import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { OverrideCandidate, OverrideConsoleView, OverridePreviewView } from '@/data/repository';
import type { ManualOverride } from '@/data/types';
import { OVERRIDE_KINDS } from '@/features/override/rules';
import type { OverrideKind } from '@/features/override/rules';
import { POLL_MS } from './manual-override.types';

export type ManualOverrideState = ReturnType<typeof useManualOverride>;
type Result<T = void> = { ok: true; value: T } | { ok: false; problem: string };
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
interface Draft { targetId: string; stage: string; until: string; reason: string }
const EMPTY: Draft = { targetId: '', stage: '', until: '', reason: '' };
const draftKey = (user: string): string => `aiec.overrideDraft.${user}`;
const readDraft = (user: string, kind: string): Draft => { try { const raw = window.localStorage.getItem(draftKey(user)); const d = raw ? (JSON.parse(raw) as { kind: string } & Draft) : null; return d && d.kind === kind ? { targetId: d.targetId ?? '', stage: d.stage ?? '', until: d.until ?? '', reason: d.reason ?? '' } : EMPTY; } catch { return EMPTY; } };

/** Screen 188. A form that remembers what was typed on this phone, previews what the override would do as soon as it can, and never sends anything until it is confirmed. */
export function useManualOverride() {
  const repository = useData();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const kindParam = params.get('kind') ?? '';
  const kind: OverrideKind | '' = (OVERRIDE_KINDS as string[]).includes(kindParam) ? (kindParam as OverrideKind) : '';
  const uid = user?.id ?? '';
  const [view, setView] = useState<OverrideConsoleView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [candidates, setCandidates] = useState<OverrideCandidate[] | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [preview, setPreview] = useState<OverridePreviewView | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!uid) return;
    try { const v = await repository.getOverrideConsole(uid); if (!alive.current) return; setView(v); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, uid]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    return () => window.clearInterval(id);
  }, [read]);

  // A different kind is a different form: its own draft comes back.
  useEffect(() => { setDraft(uid && kind ? readDraft(uid, kind) : EMPTY); setQ(''); setPreview(null); }, [kind, uid]);
  useEffect(() => { if (uid && kind) { try { window.localStorage.setItem(draftKey(uid), JSON.stringify({ kind, ...draft })); } catch { /* the phone may refuse; the form still works */ } } }, [uid, kind, draft]);

  useEffect(() => {
    if (!kind || !uid) { setCandidates(null); return undefined; }
    let live = true;
    const id = window.setTimeout(() => { void repository.getOverrideCandidates(uid, kind, q).then((c) => { if (live && alive.current) setCandidates(c); }).catch(() => { if (live) setCandidates([]); }); }, q ? 250 : 0);
    return () => { live = false; window.clearTimeout(id); };
  }, [repository, uid, kind, q, view?.recent.length]);

  const ready = !!kind && !!draft.targetId && (kind !== 'lead_stage' || !!draft.stage) && (kind !== 'stop_reminders' || !!draft.until);
  useEffect(() => {
    if (!ready || !kind) { setPreview(null); return undefined; }
    let live = true;
    const id = window.setTimeout(() => { void repository.previewOverride(uid, { kind, targetId: draft.targetId, stage: draft.stage || undefined, until: draft.until || undefined }).then((p) => { if (live && alive.current) setPreview(p); }).catch(() => { if (live) setPreview(null); }); }, 200);
    return () => { live = false; window.clearTimeout(id); };
  }, [repository, uid, kind, ready, draft.targetId, draft.stage, draft.until]);

  const act = async <T,>(fn: () => Promise<T>): Promise<Result<T>> => {
    setBusy(true);
    try { const value = await fn(); await read(); return { ok: true, value }; } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setBusy(false); }
  };
  return {
    load, offline, view, busy, kind, q, candidates, draft, preview, ready,
    refresh: read,
    setKind: (k: OverrideKind | null) => setParams((prev) => { const n = new URLSearchParams(prev); if (k) n.set('kind', k); else n.delete('kind'); return n; }, { replace: true }),
    setQ,
    edit: (next: Partial<Draft>) => setDraft((d) => ({ ...d, ...next })),
    apply: (): Promise<Result<ManualOverride>> => act(() => repository.applyOverride(uid, { kind, targetId: draft.targetId, stage: draft.stage || undefined, until: draft.until || undefined, reason: draft.reason, confirmed: true }).then((r) => { setDraft(EMPTY); setPreview(null); return r; })),
    tryProtected: (protectedKind: string, targetId: string, reason: string): Promise<Result<ManualOverride>> => act(() => repository.applyOverride(uid, { kind: protectedKind, targetId, reason, confirmed: true })),
  };
}
