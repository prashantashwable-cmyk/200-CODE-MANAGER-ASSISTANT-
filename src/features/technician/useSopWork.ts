/**
 * One job's installation work as the technician does it, shared by the checklist (123) and evidence capture (124): both write to the same
 * queue, so a capture made on one screen is never lost when the person moves to the other. Every change is written down on the phone
 * first, with the moment it was actually done, and sent in order when the network allows; the screen shows it as done at once, marked
 * "not synced". A change the server refuses (a step done out of order, a clip too long) is reported, never silently lost.
 *
 * A video cannot be kept in the phone's small local storage, so it is held only while the app is open (module-level, so moving between
 * screens keeps it). That is stated to the technician and in BUILD_README: a real build would keep it in the device's file storage.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { InstallationSopView, SopMediaInput } from '@/data/repository';
import { applyQueue } from '@/features/technician/sopQueue';
import type { LocalSop, SopQueueInput, SopQueueItem } from '@/features/technician/sopQueue';
import { newClientId } from '@/features/ids/clientId';

export type SopLoadStatus = 'loading' | 'ready' | 'error' | 'not_found';

/** How often the checklist re-reads while open. */
export const POLL_MS = 20_000;
/** Where changes not yet sent live on the phone. Per person, so a shared phone never mixes two technicians' work. */
export const queueKey = (userId: string) => `aiec.sopQueue.${userId}`;

/** Errors that mean the action itself was refused: retrying will not change the answer, so it is reported, not retried. */
export const FINAL_ERRORS = [
  'depends_on', 'evidence_missing', 'materials_not_confirmed', 'already_done', 'not_yours', 'forbidden', 'not_found', 'read_only', 'job_on_hold', 'not_started', 'invalid_state',
  'not_allowed', 'not_scheduled_yet', 'safety_step_applies', 'reason_required', 'photo_too_large', 'captured_in_future', 'captured_before_job', 'captured_invalid',
  'wrong_kind', 'video_too_large', 'video_too_long', 'finding_note_required', 'finding_only', 'not_a_video', 'not_a_photo', 'not_required', 'already_evidenced', 'already_excepted',
] as const;

export interface FailedChange {
  id: string;
  stepId: string | null;
  code: string;
}

const isFinal = (code: string) => (FINAL_ERRORS as readonly string[]).includes(code);
const newId = (): string => newClientId();
/** A video is not written to localStorage: only what survives a restart is. */
const persistable = (q: SopQueueItem) => !(q.kind === 'evidence' && q.media.kind === 'video');

/** Videos waiting to be sent, kept for the life of the app, per person. */
const volatile = new Map<string, SopQueueItem[]>();

function readQueue(key: string): SopQueueItem[] {
  let stored: SopQueueItem[] = [];
  try {
    const raw = localStorage.getItem(key);
    stored = raw ? (JSON.parse(raw) as SopQueueItem[]) : [];
  } catch {
    stored = [];
  }
  return [...stored, ...(volatile.get(key) ?? [])].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
}

/** The last checklist the server sent, so a technician who opens the app in a basement with no signal still sees the job. Kept in memory
 *  and, without the pictures (they are far too big for the phone's small storage), in localStorage. */
const viewCache = new Map<string, InstallationSopView>();
const viewKey = (userId: string, jobId: string) => `aiec.sopView.${userId}.${jobId}`;
const bare = <E extends { previewUrl: string; mediaUrl?: string }>(e: E): E => ({ ...e, previewUrl: '', mediaUrl: undefined });
function readView(userId: string, jobId: string): InstallationSopView | null {
  const key = viewKey(userId, jobId);
  const hit = viewCache.get(key);
  if (hit) return hit;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as InstallationSopView) : null;
  } catch {
    return null;
  }
}
function writeView(userId: string, jobId: string, view: InstallationSopView): void {
  const key = viewKey(userId, jobId);
  viewCache.set(key, view);
  try {
    const light: InstallationSopView = { ...view, steps: view.steps.map((st) => ({ ...st, otherFindings: st.otherFindings.map(bare), slots: st.slots.map((sl) => ({ ...sl, photo: sl.photo ? bare(sl.photo) : null, history: sl.history.map(bare) })) })) };
    localStorage.setItem(key, JSON.stringify(light));
  } catch {
    // Storage full or blocked: the in-memory copy still serves this session.
  }
}

export type SopWorkState = ReturnType<typeof useSopWork>;

export function useSopWork() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const key = user ? queueKey(user.id) : '';
  const [server, setServer] = useState<InstallationSopView | null>(() => (user && jobId ? readView(user.id, jobId) : null));
  const [status, setStatus] = useState<SopLoadStatus>(() => (server ? 'ready' : 'loading'));
  const [queue, setQueue] = useState<SopQueueItem[]>(() => (key ? readQueue(key) : []));
  const [failed, setFailed] = useState<FailedChange[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageFull, setStorageFull] = useState(false);
  const flushing = useRef(false);
  const queueRef = useRef<SopQueueItem[]>(queue);
  queueRef.current = queue;

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const persist = useCallback(
    (next: SopQueueItem[]) => {
      queueRef.current = next;
      setQueue(next);
      if (!key) return;
      const keep = next.filter(persistable);
      volatile.set(key, next.filter((q) => !persistable(q)));
      try {
        if (keep.length === 0) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(keep));
        setStorageFull(false);
      } catch {
        // The phone's storage is full: the work is still held in this session, but it would not survive closing the app.
        setStorageFull(true);
      }
    },
    [key],
  );

  const load = useCallback(async () => {
    if (!user || !jobId || !navigator.onLine) return;
    try {
      const fresh = await repository.getInstallationSop(jobId, user.id);
      writeView(user.id, jobId, fresh);
      setServer(fresh);
      setStatus('ready');
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'not_found' || code === 'forbidden') setStatus('not_found');
      else setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId]);

  /** Sends what is waiting, oldest first. An answer of "no" is reported and dropped; anything else is kept and tried again. */
  const flush = useCallback(async () => {
    if (!user || flushing.current || !navigator.onLine || queueRef.current.length === 0) return;
    flushing.current = true;
    setSyncing(true);
    try {
      for (const item of [...queueRef.current]) {
        setSendingId(item.id);
        try {
          if (item.kind === 'start') await repository.startInstallation(item.jobId, user.id, item.capturedAt);
          else if (item.kind === 'evidence') await repository.attachStepEvidence(item.jobId, item.stepId, item.slotId, { ...item.media, capturedAt: item.capturedAt }, user.id);
          else if (item.kind === 'exception') await repository.recordEvidenceException(item.jobId, item.stepId, item.slotId, item.reason, user.id, item.capturedAt);
          else if (item.kind === 'complete') await repository.completeSopStep(item.jobId, item.stepId, user.id, item.capturedAt);
          else if (item.kind === 'na') await repository.markStepNotApplicable(item.jobId, item.stepId, item.reason, user.id, item.capturedAt);
          else await repository.focusSopStep(item.jobId, item.stepId, user.id);
          persist(queueRef.current.filter((q) => q.id !== item.id));
        } catch (e) {
          const code = e instanceof Error ? e.message : 'generic';
          if (!isFinal(code)) break;
          persist(queueRef.current.filter((q) => q.id !== item.id));
          // A focus that no longer fits is not worth alarming anyone over; everything else is.
          if (item.kind !== 'focus') setFailed((f) => [...f, { id: item.id, stepId: 'stepId' in item ? item.stepId : null, code }]);
        }
      }
    } finally {
      flushing.current = false;
      setSyncing(false);
      setSendingId(null);
      await load();
    }
  }, [repository, user, persist, load]);

  useEffect(() => {
    const kept = user && jobId ? readView(user.id, jobId) : null;
    setServer(kept);
    setStatus(kept ? 'ready' : 'loading');
    void load().then(() => flush());
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, flush]);
  // Back online: send what was done while away, then catch up.
  useEffect(() => {
    if (isOnline) void flush();
  }, [isOnline, flush]);
  const reload = () => {
    setStatus('loading');
    void load();
  };

  const enqueue = useCallback(
    (item: SopQueueInput, at?: string) => {
      if (!jobId) return;
      const full = { ...item, id: newId(), jobId, capturedAt: at ?? new Date().toISOString() } as SopQueueItem;
      persist([...queueRef.current, full]);
      void flush();
    },
    [jobId, persist, flush],
  );

  const local: LocalSop | null = useMemo(() => (server ? applyQueue(server, queue, user?.name ?? '') : null), [server, queue, user?.name]);
  const jobQueue = useMemo(() => queue.filter((q) => q.jobId === jobId), [queue, jobId]);

  return {
    status,
    reload,
    view: local?.view ?? null,
    local,
    queue: jobQueue,
    queuedAll: queue.length,
    failed,
    dismissFailed: () => setFailed([]),
    syncing,
    sendingId,
    isOnline,
    storageFull,
    /** A video is waiting and would be lost if the app closed now. */
    videoAtRisk: queue.some((q) => q.kind === 'evidence' && q.media.kind === 'video'),
    start: () => enqueue({ kind: 'start' }),
    complete: (stepId: string) => enqueue({ kind: 'complete', stepId }),
    markNa: (stepId: string, reason: string) => enqueue({ kind: 'na', stepId, reason }),
    focusStep: (stepId: string) => enqueue({ kind: 'focus', stepId }),
    /** Queues a capture with the moment it was taken. */
    addEvidence: (stepId: string, slotId: string, media: Omit<SopMediaInput, 'capturedAt'>, takenAt?: string) => enqueue({ kind: 'evidence', stepId, slotId, media }, takenAt),
    addException: (stepId: string, slotId: string, reason: string) => enqueue({ kind: 'exception', stepId, slotId, reason }),
  };
}
