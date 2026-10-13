import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SupportBoard, SupportChatView, SupportThread } from '@/data/repository';
import { POLL_MS, WAITING_POLL_MS, outboxKey, threadPath, viewKey } from './support-chat.types';
import { newClientId } from '@/features/ids/clientId';

export type SupportChatState = ReturnType<typeof useSupportChat>;
type Intent = 'payment_status' | 'progress' | 'amc' | 'troubleshoot' | 'human';
export interface Pending { clientId: string; text: string; intent?: Intent; at: string }

const newId = (): string => newClientId('c-');
function readJson<T>(key: string, fallback: T): T { try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v ?? fallback; } catch { return fallback; } }
function writeJson(key: string, value: unknown): void { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* a full phone must not break the chat */ } }

/** Screen 176. The customer's chat (one repository read, a message kept on the phone with its own id until it is sent), and Admin's board and thread. */
export function useSupportChat() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { conversationId = '' } = useParams<{ conversationId?: string }>();
  const [params, setParams] = useSearchParams();
  const role = user?.role === 'admin' ? 'admin' : 'customer';
  const filter = params.get('f') ?? 'waiting';
  const [chat, setChat] = useState<SupportChatView | null>(() => (user && role === 'customer' ? readJson<SupportChatView | null>(viewKey(user.id), null) : null));
  const [board, setBoard] = useState<SupportBoard | null>(null);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [pending, setPending] = useState<Pending[]>(() => (user ? readJson<Pending[]>(outboxKey(user.id), []) : []));
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>(chat ? 'ready' : 'loading');
  const [threadState, setThreadState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [offline, setOffline] = useState(false);
  const [failed, setFailed] = useState(false);
  const alive = useRef(true);
  const busy = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const read = useCallback(async () => {
    if (!user) return;
    try {
      if (role === 'customer') { const v = await repository.getSupportChat(user.id); if (!alive.current) return; setChat(v); writeJson(viewKey(user.id), v); }
      else { const v = await repository.getSupportBoard(user.id); if (!alive.current) return; setBoard(v); }
      setLoad('ready'); setOffline(false);
    } catch { if (alive.current) { setOffline(true); setLoad((s) => (s === 'ready' ? s : 'error')); } }
  }, [repository, user, role]);
  const readThread = useCallback(async () => {
    if (!user || role !== 'admin' || !conversationId) { setThread(null); return; }
    try { const v = await repository.getSupportThread(conversationId, user.id); if (alive.current) { setThread(v); setThreadState('ready'); } }
    catch (e) { if (alive.current) setThreadState(e instanceof Error && (e.message === 'not_found' || e.message === 'forbidden') ? 'missing' : 'error'); }
  }, [repository, user, role, conversationId]);
  useEffect(() => { setThreadState('loading'); void readThread(); }, [readThread]);

  /** Sends what is waiting on the phone, in order; a message that goes is taken off the phone. */
  const flush = useCallback(async () => {
    if (!user || role !== 'customer' || busy.current || !navigator.onLine) return;
    const box = readJson<Pending[]>(outboxKey(user.id), []);
    if (box.length === 0) return;
    busy.current = true;
    let left = box;
    try {
      for (const m of box) {
        try { const v = await repository.sendSupportMessage(user.id, { clientId: m.clientId, text: m.text, intent: m.intent }); left = left.filter((x) => x.clientId !== m.clientId); if (alive.current) { setChat(v); writeJson(viewKey(user.id), v); } }
        catch { if (alive.current) setFailed(true); break; }
      }
    } finally { writeJson(outboxKey(user.id), left); busy.current = false; if (alive.current) setPending(left); }
  }, [repository, user, role]);

  const waiting = chat?.handling === 'waiting' || board?.counts.waiting;
  useEffect(() => {
    void read(); void flush();
    const id = window.setInterval(() => { void read(); void readThread(); void flush(); }, waiting ? WAITING_POLL_MS : POLL_MS);
    const onShow = () => { if (document.visibilityState === 'visible') { void read(); void readThread(); void flush(); } };
    document.addEventListener('visibilitychange', onShow);
    window.addEventListener('online', flush);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onShow); window.removeEventListener('online', flush); };
  }, [read, readThread, flush, waiting]);

  const patch = (fn: (n: URLSearchParams) => void) => setParams((prev) => { const n = new URLSearchParams(prev); fn(n); return n; }, { replace: true });
  return {
    role, load, offline, failed, chat, board, thread, threadState, pending, filter, conversationId,
    refresh: read,
    send: async (text: string, intent?: Intent) => {
      if (!user) return;
      const m: Pending = { clientId: newId(), text: text.trim(), intent, at: new Date().toISOString() };
      if (!m.text) return;
      setFailed(false);
      const box = [...readJson<Pending[]>(outboxKey(user.id), []), m];
      writeJson(outboxKey(user.id), box); setPending(box);
      await flush();
    },
    agentSend: async (text: string): Promise<boolean> => { if (!user || !conversationId) return false; try { const v = await repository.sendSupportAgentMessage(conversationId, user.id, text); setThread(v); void read(); return true; } catch { return false; } },
    handBack: async (): Promise<boolean> => { if (!user || !conversationId) return false; try { const v = await repository.handBackSupportChat(conversationId, user.id); setThread(v); void read(); return true; } catch { return false; } },
    setFilter: (f: string) => patch((n) => { if (f && f !== 'waiting') n.set('f', f); else n.delete('f'); }),
    open: (id: string) => navigate(threadPath(id)),
    list: () => navigate('/support-chat'),
    goTo: (path: string) => navigate(path),
  };
}
