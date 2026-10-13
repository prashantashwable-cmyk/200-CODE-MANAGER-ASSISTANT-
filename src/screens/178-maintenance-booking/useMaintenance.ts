import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { MaintenanceBooking, MaintenanceDeskView, TicketView, VisitTracking } from '@/data/repository';
import { POLL_MS, TRACK_POLL_MS, bookingPath, draftKey, viewKey } from './maintenance-booking.types';
import { newClientId } from '@/features/ids/clientId';

export type MaintenanceState = ReturnType<typeof useMaintenance>;
export interface Draft { purpose: 'routine' | 'adhoc'; note: string }
const newId = (): string => newClientId('m-');
function readJson<T>(key: string, fallback: T): T { try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v ?? fallback; } catch { return fallback; } }
function writeJson(key: string, value: unknown): void { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* the phone may refuse; the screen still works */ } }
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : 'generic');
type Result = { ok: true } | { ok: false; problem: string };

/** Screen 178. The customer's booking desk (their cover, real slots, the matched technician) and, for one visit, its status, change and live arrival on the day. */
export function useMaintenance() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { ticketId = '' } = useParams<{ ticketId?: string }>();
  const [params, setParams] = useSearchParams();
  const job = params.get('job') ?? '';
  const [desk, setDesk] = useState<MaintenanceDeskView | null>(() => (user ? readJson<MaintenanceDeskView | null>(viewKey(user.id, job), null) : null));
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>(desk ? 'ready' : 'loading');
  const [offline, setOffline] = useState(false);
  const [ticket, setTicket] = useState<TicketView | null>(null);
  const [tracking, setTracking] = useState<VisitTracking | null>(null);
  const [ticketState, setTicketState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [draft, setDraftState] = useState<Draft>(() => ({ purpose: 'routine', note: '', ...(user ? readJson<Partial<Draft>>(draftKey(user.id), {}) : {}) }));
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<MaintenanceBooking | null>(null);
  const clientId = useRef(newId());
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try { const v = await repository.getMaintenanceDesk(user.id, job || null); if (!alive.current) return; setDesk(v); writeJson(viewKey(user.id, job), v); setLoad('ready'); setOffline(false); }
    catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, user, job]);
  const readTicket = useCallback(async () => {
    if (!user || !ticketId) { setTicket(null); setTracking(null); return; }
    try {
      const [v, tr] = await Promise.all([repository.getServiceTicket(ticketId, user.id), repository.getVisitTracking(ticketId, user.id)]);
      if (alive.current) { setTicket(v); setTracking(tr); setTicketState('ready'); }
    } catch (e) { if (alive.current) setTicketState(e instanceof Error && (e.message === 'not_found' || e.message === 'forbidden') ? 'missing' : 'error'); }
  }, [repository, user, ticketId]);
  useEffect(() => { setTicketState('loading'); void readTicket(); }, [readTicket]);
  const live = tracking?.phase === 'on_the_way' || tracking?.phase === 'scheduled';
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); void readTicket(); }, live ? TRACK_POLL_MS : POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') { void read(); void readTicket(); } };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read, readTicket, live]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  const setDraft = (next: Partial<Draft>) => setDraftState((d) => { const v = { ...d, ...next }; if (user) writeJson(draftKey(user.id), v); return v; });
  const act = async (fn: () => Promise<unknown>): Promise<Result> => { try { await fn(); await Promise.all([read(), readTicket()]); return { ok: true }; } catch (e) { return { ok: false, problem: problemOf(e) }; } };
  return {
    load, offline, desk, job, ticketId, ticket, tracking, ticketState, draft, sending, result,
    refresh: read,
    setDraft,
    pickLift: (id: string) => patch((n) => { n.set('job', id); }),
    book: async (jobId: string, slot: { date: string; window: 'morning' | 'afternoon' } | null): Promise<Result> => {
      if (!user) return { ok: false, problem: 'generic' };
      setSending(true);
      try {
        const r = await repository.bookMaintenanceVisit(user.id, { clientId: clientId.current, jobId, purpose: draft.purpose, date: slot?.date ?? null, window: slot?.window ?? 'morning', note: draft.note });
        clientId.current = newId();
        if (user) try { localStorage.removeItem(draftKey(user.id)); } catch { /* nothing to clear */ }
        setDraftState({ purpose: 'routine', note: '' });
        if (alive.current) setResult(r);
        void read();
        return { ok: true };
      } catch (e) { return { ok: false, problem: problemOf(e) }; } finally { if (alive.current) setSending(false); }
    },
    reschedule: (date: string, window: 'morning' | 'afternoon') => act(() => repository.rescheduleMaintenanceVisit(ticketId, user?.id ?? '', { date, window })),
    cancel: (reason: string) => act(() => repository.withdrawServiceTicket(ticketId, user?.id ?? '', reason)),
    clearResult: () => setResult(null),
    open: (id: string) => navigate(bookingPath(id)),
    list: () => navigate('/maintenance'),
    goTo: (path: string) => navigate(path),
  };
}
