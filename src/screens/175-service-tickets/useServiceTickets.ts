import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ServiceDeskView, TicketBoard, TicketBoardFilter, TicketCreateInput, TicketRow, TicketTechnician, TicketView } from '@/data/repository';
import type { TicketCategory, TicketResponsibility, TicketUrgency, VisitOutcome } from '@/data/types';
import { filingProblem } from '@/features/service/tickets';
import { currentPlace, prepareStill, prepareVideo } from '@/features/technician/mediaCapture';
import { EMPTY_DRAFT, POLL_MS, draftKey, outboxKey, ticketPath, viewKey } from './service-tickets.types';
import type { TicketDraft } from './service-tickets.types';
import { newClientId } from '@/features/ids/clientId';

export type ServiceTicketsState = ReturnType<typeof useServiceTickets>;
export type Attachment = TicketCreateInput['attachments'][number];
export type Result = { ok: true } | { ok: false; problem: string };
const GENERIC = 'generic';
const problemOf = (e: unknown): string => (e instanceof Error && e.message && e.message !== 'repository_failed' ? e.message : GENERIC);
const newId = (): string => newClientId('c-');

function readJson<T>(key: string, fallback: T): T {
  try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v ?? fallback; } catch { return fallback; }
}
function writeJson(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* a full phone must not break the screen */ }
}

/** Turns the files a customer picks into what is kept: stills made small, a video's first picture and length. */
export async function prepareFiles(files: File[]): Promise<{ ok: Attachment[]; failed: number }> {
  const ok: Attachment[] = [];
  let failed = 0;
  for (const f of files) {
    try {
      if (f.type.startsWith('video/')) { const v = await prepareVideo(f); ok.push({ kind: 'video', fileName: v.fileName, mimeType: v.mimeType, sizeBytes: v.sizeBytes, durationS: v.durationS, previewUrl: v.previewUrl }); }
      else { const p = await prepareStill(f); ok.push({ kind: 'photo', fileName: p.fileName, mimeType: p.mimeType, sizeBytes: p.sizeBytes, previewUrl: p.previewUrl }); }
    } catch { failed += 1; }
  }
  return { ok, failed };
}

/** Screen 175. The role decides what is read (the customer's desk, Admin's board, the technician's visits); one ticket opens at `/service-requests/<id>`, and everything is a repository call so the three views never disagree. */
export function useServiceTickets() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { ticketId = '' } = useParams<{ ticketId?: string }>();
  const [params, setParams] = useSearchParams();
  const role = user?.role === 'admin' ? 'admin' : user?.role === 'technician' ? 'technician' : 'customer';
  const tab = params.get('tab') ?? '';
  const filter = (params.get('f') ?? 'open') as NonNullable<TicketBoardFilter['state']>;
  const [q, setQ] = useState('');
  const [desk, setDesk] = useState<ServiceDeskView | null>(() => (user && role === 'customer' ? readJson<ServiceDeskView | null>(viewKey(user.id, 'desk'), null) : null));
  const [board, setBoard] = useState<TicketBoard | null>(null);
  const [visits, setVisits] = useState<TicketRow[] | null>(null);
  const [ticket, setTicket] = useState<TicketView | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>(desk ? 'ready' : 'loading');
  const [ticketState, setTicketState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [draft, setDraftState] = useState<TicketDraft>(() => (user ? { ...EMPTY_DRAFT, ...readJson<Partial<TicketDraft>>(draftKey(user.id), {}) } : EMPTY_DRAFT));
  const [files, setFiles] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [queued, setQueued] = useState(() => (user ? readJson<TicketCreateInput[]>(outboxKey(user.id), []).length : 0));
  const [sent, setSent] = useState<TicketView | null>(null);
  const alive = useRef(true);
  const seq = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    const mine = ++seq.current;
    try {
      if (role === 'customer') { const v = await repository.getServiceDesk(user.id); if (!alive.current || mine !== seq.current) return; setDesk(v); writeJson(viewKey(user.id, 'desk'), v); }
      else if (role === 'admin') { const v = await repository.getServiceBoard({ state: filter, q }, user.id); if (!alive.current || mine !== seq.current) return; setBoard(v); }
      else { const v = await repository.listMyServiceVisits(user.id); if (!alive.current || mine !== seq.current) return; setVisits(v); }
      setLoad('ready'); setOffline(false);
    } catch {
      if (alive.current && mine === seq.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); }
    }
  }, [repository, user, role, filter, q]);
  const readTicket = useCallback(async () => {
    if (!user || !ticketId) { setTicket(null); return; }
    try {
      const v = await repository.getServiceTicket(ticketId, user.id);
      if (!alive.current) return;
      setTicket(v); setTicketState('ready');
      if (role === 'customer' && v.events.some((e) => e.byRole !== 'customer')) void repository.markServiceTicketSeen(ticketId, user.id).catch(() => undefined);
    } catch (e) {
      if (alive.current) setTicketState(e instanceof Error && (e.message === 'not_found' || e.message === 'forbidden') ? 'missing' : 'error');
    }
  }, [repository, user, ticketId, role]);
  useEffect(() => { setTicketState('loading'); void readTicket(); }, [readTicket]);
  useEffect(() => {
    void read();
    const id = window.setInterval(() => { void read(); void readTicket(); }, POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') { void read(); void readTicket(); } };
    document.addEventListener('visibilitychange', onShow);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); };
  }, [read, readTicket]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  const setDraft = (next: Partial<TicketDraft>) => setDraftState((d) => { const v = { ...d, ...next }; if (user) writeJson(draftKey(user.id), v); return v; });
  const clearDraft = () => { setDraftState(EMPTY_DRAFT); setFiles([]); if (user) try { localStorage.removeItem(draftKey(user.id)); } catch { /* nothing to clear */ } };

  const act = async (fn: () => Promise<TicketView | void>): Promise<Result> => {
    try { const v = await fn(); if (v) setTicket(v); void read(); return { ok: true }; } catch (e) { return { ok: false, problem: problemOf(e) }; }
  };

  /** Sends a request, or keeps it on the phone with its own id until signal returns (the id makes a double send harmless). */
  const send = async (input: TicketCreateInput): Promise<{ ok: true; ticket: TicketView | null } | { ok: false; problem: string }> => {
    if (!user) return { ok: false, problem: GENERIC };
    if (!navigator.onLine) {
      const box = readJson<TicketCreateInput[]>(outboxKey(user.id), []);
      box.push(input); writeJson(outboxKey(user.id), box); setQueued(box.length);
      return { ok: true, ticket: null };
    }
    try { const v = await repository.createServiceTicket(input, user.id); void read(); return { ok: true, ticket: v }; } catch (e) { return { ok: false, problem: problemOf(e) }; }
  };
  const flush = useCallback(async () => {
    if (!user || role !== 'customer' || !navigator.onLine) return;
    const box = readJson<TicketCreateInput[]>(outboxKey(user.id), []);
    if (box.length === 0) return;
    const left: TicketCreateInput[] = [];
    for (const item of box) { try { await repository.createServiceTicket(item, user.id); } catch (e) { if (problemOf(e) === GENERIC) left.push(item); } }
    writeJson(outboxKey(user.id), left); if (alive.current) { setQueued(left.length); void read(); }
  }, [repository, user, role, read]);
  useEffect(() => { void flush(); window.addEventListener('online', flush); return () => window.removeEventListener('online', flush); }, [flush]);

  const submit = async (): Promise<Result> => {
    if (!draft.category) return { ok: false, problem: 'category_required' };
    const lift = desk?.lifts.find((l) => l.key === draft.liftKey) ?? null;
    if (!lift) return { ok: false, problem: 'lift_required' };
    const physical = draft.category === 'safety' || draft.category === 'fault';
    const jobId = physical ? lift.jobId : null;
    const problem = filingProblem({ category: draft.category, jobId, description: draft.description, impact: draft.impact, attachments: files.length });
    if (problem) return { ok: false, problem };
    setSending(true);
    const r = await send({ clientId: newId(), dealId: lift.dealId, jobId, category: draft.category, impact: draft.category === 'fault' ? draft.impact : null, description: draft.description.trim(), claim: draft.claim && (draft.category === 'fault' || draft.category === 'safety'), attachments: files });
    if (alive.current) setSending(false);
    if (!r.ok) return r;
    clearDraft();
    if (r.ticket) setSent(r.ticket);
    return { ok: true };
  };
  const emergency = async (liftKey: string): Promise<Result & { ticket?: TicketView | null; queued?: boolean }> => {
    const lift = desk?.lifts.find((l) => l.key === liftKey && l.handedOver) ?? null;
    if (!lift) return { ok: false, problem: 'lift_required' };
    const location = await currentPlace(2500);
    const r = await send({ clientId: newId(), dealId: lift.dealId, jobId: lift.jobId, category: 'emergency', impact: null, description: '', claim: false, attachments: [], location });
    if (!r.ok) return r;
    return { ok: true, ticket: r.ticket, queued: !r.ticket };
  };
  const addFiles = async (list: File[]): Promise<number> => {
    const { ok, failed } = await prepareFiles(list);
    setFiles((cur) => [...cur, ...ok].slice(0, 12));
    return failed;
  };

  return {
    role, load, offline, tab, filter, q, ticketId, desk, board, visits, ticket, ticketState, draft, files, sending, queued, sent,
    refresh: read,
    setQ, setDraft, clearDraft, addFiles,
    removeFile: (i: number) => setFiles((cur) => cur.filter((_, k) => k !== i)),
    clearSent: () => setSent(null),
    setTab: (t: string) => patch((n) => { if (t) n.set('tab', t); else n.delete('tab'); }),
    setFilter: (f: string) => patch((n) => { if (f && f !== 'open') n.set('f', f); else n.delete('f'); }),
    open: (id: string) => navigate(ticketPath(id)),
    list: () => navigate('/service-requests'),
    goTo: (path: string) => navigate(path),
    submit, emergency,
    addInfo: (note: string, attachments: Attachment[]) => act(() => repository.addTicketNote(ticketId, user?.id ?? '', { note, attachments })),
    withdraw: (reason: string) => act(() => repository.withdrawServiceTicket(ticketId, user?.id ?? '', reason)),
    reopen: (note: string) => act(() => repository.reopenServiceTicket(ticketId, user?.id ?? '', note)),
    reply: (note: string, internal: boolean) => act(() => repository.addTicketNote(ticketId, user?.id ?? '', { note, internal })),
    triage: (category: TicketCategory, urgency: TicketUrgency, note: string) => act(() => repository.triageServiceTicket(ticketId, user?.id ?? '', { category, urgency, note })),
    technicians: (date: string): Promise<TicketTechnician[]> => repository.listServiceTechnicians(date, user?.id ?? '').catch(() => []),
    assign: (technicianId: string, date: string, window: 'morning' | 'afternoon', note: string) => act(() => repository.assignServiceVisit(ticketId, user?.id ?? '', { technicianId, date, window, note })),
    start: () => act(() => repository.startServiceTicket(ticketId, user?.id ?? '')),
    resolve: (note: string) => act(() => repository.resolveServiceTicket(ticketId, user?.id ?? '', note)),
    decide: (responsibility: TicketResponsibility, note: string, reviewedEvidence: boolean) => act(() => repository.decideTicketClaim(ticketId, user?.id ?? '', { responsibility, note, reviewedEvidence })),
    startVisit: () => act(() => repository.startServiceVisit(ticketId, user?.id ?? '')),
    onTheWay: async () => { const place = await currentPlace(2500); return act(() => repository.markOnTheWay(ticketId, user?.id ?? '', place)); },
    completeVisit: (outcome: VisitOutcome, notes: string, partsNote: string) => act(() => repository.completeServiceVisit(ticketId, user?.id ?? '', { outcome, notes, partsNote })),
  };
}
