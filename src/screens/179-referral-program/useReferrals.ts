import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { applyLanguage } from '@/i18n';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ReferralDeskView, ReferralInput, ReferralLandingView, ReferralRowView, ReferralSubmitResult } from '@/data/repository';
import { POLL_MS, inviteDraftKey, viewKey } from './referral-program.types';
import { newClientId } from '@/features/ids/clientId';

export type ReferralsState = ReturnType<typeof useReferrals>;
export type LandingState = ReturnType<typeof useReferralLanding>;
export interface FormDraft { name: string; phone: string; city: string; note: string; consent: boolean }
export const emptyDraft: FormDraft = { name: '', phone: '', city: '', note: '', consent: false };
const newId = (): string => newClientId('rf-');
function readJson<T>(key: string, fallback: T): T { try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v ?? fallback; } catch { return fallback; } }
function writeJson(key: string, value: unknown): void { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* the phone may refuse; the screen still works */ } }
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
type Result = { ok: true; result: ReferralSubmitResult } | { ok: false; problem: string };

/** Screen 179. The customer's referral desk: their code and link, the people they referred and where each stands, the reward, and a way to invite someone by name. */
export function useReferrals() {
  const repository = useData();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const open = params.get('r') ?? '';
  const invite = params.get('invite') === '1';
  const [desk, setDesk] = useState<ReferralDeskView | null>(() => (user ? readJson<ReferralDeskView | null>(viewKey(user.id), null) : null));
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>(desk ? 'ready' : 'loading');
  const [offline, setOffline] = useState(false);
  const [draft, setDraftState] = useState<FormDraft>(() => ({ ...emptyDraft, ...(user ? readJson<Partial<FormDraft>>(inviteDraftKey(user.id), {}) : {}), consent: false }));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<ReferralSubmitResult | null>(null);
  const clientId = useRef(newId());
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try { const v = await repository.getReferralDesk(user.id); if (!alive.current) return; setDesk(v); writeJson(viewKey(user.id), v); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, user]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  const setDraft = (next: Partial<FormDraft>) => setDraftState((d) => { const v = { ...d, ...next }; if (user) writeJson(inviteDraftKey(user.id), { ...v, consent: false }); return v; });
  const link = desk ? `${window.location.origin}/refer/${encodeURIComponent(desk.code)}` : '';
  const row: ReferralRowView | null = desk?.rows.find((r) => r.id === open) ?? null;
  return {
    load, offline, desk, link, draft, sending, sent, open, invite, row,
    refresh: read,
    setDraft,
    openRow: (id: string | null) => patch((n) => { if (id) n.set('r', id); else n.delete('r'); }),
    openInvite: (on: boolean) => { if (!on) setSent(null); patch((n) => { if (on) n.set('invite', '1'); else n.delete('invite'); }); },
    send: async (): Promise<Result> => {
      if (!user) return { ok: false, problem: 'generic' };
      setSending(true);
      try {
        const input: ReferralInput = { clientId: clientId.current, name: draft.name, phone: draft.phone, city: draft.city, note: draft.note, consent: draft.consent };
        const r = await repository.inviteReferral(user.id, input);
        clientId.current = newId();
        try { localStorage.removeItem(inviteDraftKey(user.id)); } catch { /* nothing to clear */ }
        setDraftState(emptyDraft);
        if (alive.current) setSent(r);
        void read();
        return { ok: true, result: r };
      } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setSending(false); }
    },
    another: () => { setSent(null); },
  };
}

/** The page a referred person lands on from a link: the referrer's first name, a short form, and an honest answer. Nothing here needs an account. */
export function useReferralLanding() {
  const repository = useData();
  const { code = '' } = useParams<{ code?: string }>();
  const [view, setView] = useState<ReferralLandingView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [draft, setDraftState] = useState<FormDraft>(emptyDraft);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<ReferralSubmitResult | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const clientId = useRef(newId());
  const read = useCallback(async () => {
    setLoad('loading');
    try { setView(await repository.getReferralLanding(code)); setLoad('ready'); } catch { setLoad('error'); }
  }, [repository, code]);
  useEffect(() => { void read(); }, [read]);
  return {
    load, view, draft, sending, done, problem, code,
    reload: read,
    setDraft: (next: Partial<FormDraft>) => setDraftState((d) => ({ ...d, ...next })),
    setLanguage: applyLanguage,
    submit: async () => {
      setSending(true);
      setProblem(null);
      try {
        setDone(await repository.submitReferralFromLink(code, { clientId: clientId.current, name: draft.name, phone: draft.phone, city: draft.city, note: draft.note, consent: draft.consent }));
      } catch (e) { setProblem(problemOf(e)); } finally { setSending(false); }
    },
  };
}
