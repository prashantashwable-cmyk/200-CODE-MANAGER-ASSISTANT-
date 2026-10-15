import { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { newClientId } from '@/features/ids/clientId';
import { enqueue, flush, needsAttention, pendingCount, prune } from '@/features/sync/queue';
import type { QueueItem, SendResult } from '@/features/sync/queue';
import type { LeadCaptureInput, LeadCaptureResult } from '@/data/repository';

export type CaptureForm = { siteName: string; contactName: string; contactPhone: string; city: string; location: { lat: number; lng: number } | null; accuracyM: number | null };
export interface Outcome { clientEventId: string; siteName: string; result: LeadCaptureResult }

/** Refusals that will never succeed on a retry: the person has to change something. */
const FINAL = new Set(['forbidden', 'location_invalid', 'site_name_required', 'client_event_id_required']);
const keyOf = (uid: string) => `aiec.captureQueue.${uid}`;

function load(uid: string): QueueItem[] {
  try { const raw = localStorage.getItem(keyOf(uid)); return raw ? (JSON.parse(raw) as QueueItem[]) : []; } catch { return []; }
}
function save(uid: string, q: QueueItem[]): void {
  try { localStorage.setItem(keyOf(uid), JSON.stringify(q)); } catch { /* a full or blocked store only loses the offline copy */ }
}

/**
 * Screen 205. A capture is written to the phone first (with its own time), shown at once as "waiting", and sent when there is
 * signal. The queue itself is `@/features/sync/queue`; this hook only persists it and supplies the real sender.
 */
export function useQuickCapture() {
  const repository = useData();
  const { user } = useSession();
  const uid = user?.id ?? '';
  const [queue, setQueue] = useState<QueueItem[]>(() => load(uid));
  const [online, setOnline] = useState<boolean>(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const busy = useRef(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const commit = useCallback((q: QueueItem[]) => { queueRef.current = q; setQueue(q); save(uid, q); }, [uid]);

  const send = useCallback(async (item: QueueItem): Promise<SendResult> => {
    if (!navigator.onLine) return { ok: false, retry: true, error: 'offline' };
    try {
      const payload = item.payload as unknown as Omit<LeadCaptureInput, 'clientEventId' | 'capturedAt' | 'deviceSentAt'> & { siteName: string };
      const result = await repository.submitLeadCapture(uid, { clientEventId: item.clientEventId, draft: payload.draft, accuracyM: payload.accuracyM ?? null, capturedAt: item.capturedAt, deviceSentAt: new Date().toISOString() });
      setOutcomes((o) => (o.some((x) => x.clientEventId === item.clientEventId) ? o : [{ clientEventId: item.clientEventId, siteName: payload.siteName, result }, ...o]));
      return { ok: true, duplicate: result.duplicate };
    } catch (e) {
      const code = e instanceof Error ? e.message : 'network';
      return FINAL.has(code) ? { ok: false, retry: false, error: code } : { ok: false, retry: true, error: code };
    }
  }, [repository, uid]);

  const run = useCallback(async () => {
    if (busy.current || !uid) return;
    busy.current = true;
    try { commit(await flush(queueRef.current, send, Date.now())); } finally { busy.current = false; }
  }, [commit, send, uid]);

  useEffect(() => { commit(load(uid)); }, [uid, commit]);
  useEffect(() => {
    const on = () => { setOnline(true); void run(); };
    const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    const id = window.setInterval(() => { void run(); }, 10_000);
    void run();
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); window.clearInterval(id); };
  }, [run]);

  return {
    online, queue, outcomes,
    waiting: pendingCount(queue),
    attention: needsAttention(queue),
    capture: async (f: CaptureForm) => {
      if (!f.location) return;
      const draft = { stage: 'captured', surveyorId: uid, source: 'field_survey', builderName: '', contactName: f.contactName.trim(), contactPhone: f.contactPhone, siteName: f.siteName.trim(), address: '', city: f.city.trim() || 'Pune', pincode: '', location: f.location, photos: [], estimatedValue: 0, incentiveAmount: 0, incentiveStatus: 'projected' } as unknown as LeadCaptureInput['draft'];
      commit(enqueue(queueRef.current, { clientEventId: newClientId('cap-'), kind: 'lead.captured', capturedAt: new Date().toISOString(), payload: { draft, accuracyM: f.accuracyM, siteName: f.siteName.trim() } as unknown as Record<string, unknown> }));
      await run();
    },
    retry: () => { commit(queueRef.current.map((i) => (i.status === 'failed' ? { ...i, status: 'pending', attempts: 0, nextTryAt: 0 } : i))); void run(); },
    clearSent: () => commit(prune(queueRef.current)),
    discard: (id: string) => commit(queueRef.current.filter((i) => i.clientEventId !== id)),
  };
}
