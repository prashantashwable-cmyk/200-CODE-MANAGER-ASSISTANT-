import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { PreInspectionSummaryView, SafetyChecklistView, SafetyItemView, SafetySlotView } from '@/data/repository';
import type { SafetyFixKind, SafetyStateItem } from '@/data/types';
import { applySafetyQueue } from '@/features/technician/safetyQueue';
import type { SafetyQueueInput, SafetyQueueItem } from '@/features/technician/safetyQueue';
import { isCleared } from '@/features/technician/safety';
import { useSopWork } from '@/features/technician/useSopWork';
import type { SafetyStatus } from './safety-checklist.types';
import { FINAL_ERRORS, POLL_MS, SAFETY_KEYS as K, jobPath, queueKey, viewKey } from './safety-checklist.types';
import { newClientId } from '@/features/ids/clientId';

export interface FailedChange {
  id: string;
  itemId: string;
  code: string;
}
export interface ActionResult {
  ok: boolean;
  code?: string;
}

const isFinal = (code: string) => (FINAL_ERRORS as readonly string[]).includes(code);
const newId = (): string => newClientId();
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

function readQueue(key: string): SafetyQueueItem[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SafetyQueueItem[]) : [];
  } catch {
    return [];
  }
}
function readView(key: string): SafetyChecklistView | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SafetyChecklistView) : null;
  } catch {
    return null;
  }
}
/** A pass on a slot the phone has proof for: the pictures are far too big to keep in local storage, so the copy kept has none. */
const light = (v: SafetyChecklistView): SafetyChecklistView => ({ ...v, items: v.items.map((i) => ({ ...i, slots: i.slots.map((sl) => ({ ...sl, proof: sl.proof ? { ...sl.proof, previewUrl: '', mediaUrl: undefined } : null })) })) });

export type SafetyState = ReturnType<typeof useSafetyChecklist>;

/**
 * Screen 126. The checks and their rules come from `@/features/technician/safety`, the same functions the repository enforces, so what the
 * screen says a pass needs (its evidence, the checks that come first) is what is required. Results and fixes are written on the phone with the
 * moment they were done and sent when the network allows; anything only Admin can do goes straight to the server. The evidence a check needs
 * is captured inline through the same queue the installation checklist uses (124), so it lands in the one evidence record.
 */
export function useSafetyChecklist() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const work = useSopWork();
  const isAdmin = user?.role === 'admin';
  const qKey = user && !isAdmin ? queueKey(user.id) : '';
  const vKey = user && jobId ? viewKey(user.id, jobId) : '';
  const [server, setServer] = useState<SafetyChecklistView | null>(() => (vKey ? readView(vKey) : null));
  const [status, setStatus] = useState<SafetyStatus>(() => (server ? 'ready' : 'loading'));
  const [queue, setQueue] = useState<SafetyQueueItem[]>(() => (qKey ? readQueue(qKey) : []));
  const [failed, setFailed] = useState<FailedChange[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stateItems, setStateItems] = useState<SafetyStateItem[] | null>(null);
  const flushing = useRef(false);
  const queueRef = useRef(queue);
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
    (next: SafetyQueueItem[]) => {
      queueRef.current = next;
      setQueue(next);
      if (!qKey) return;
      try {
        if (next.length === 0) localStorage.removeItem(qKey);
        else localStorage.setItem(qKey, JSON.stringify(next));
      } catch {
        // Storage full: still held while the app stays open.
      }
    },
    [qKey],
  );

  const load = useCallback(async () => {
    if (!user || !jobId || !navigator.onLine) return;
    try {
      const fresh = await repository.getSafetyChecklist(jobId, user.id);
      setServer(fresh);
      setStatus('ready');
      try {
        localStorage.setItem(viewKey(user.id, jobId), JSON.stringify(light(fresh)));
      } catch {
        // Not cached: the in-memory copy serves this session.
      }
    } catch (e) {
      const code = codeOf(e);
      if (code === 'not_found' || code === 'forbidden') setStatus('not_found');
      else setStatus((c) => (c === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId]);

  const flush = useCallback(async () => {
    if (!user || flushing.current || !navigator.onLine || queueRef.current.length === 0) return;
    flushing.current = true;
    setSyncing(true);
    try {
      for (const item of [...queueRef.current]) {
        try {
          if (item.kind === 'result') await repository.recordSafetyResult(item.jobId, item.itemId, { result: item.result, measured: item.measured, note: item.note, capturedAt: item.capturedAt }, user.id);
          else await repository.recordSafetyFix(item.jobId, item.itemId, item.fixKind, item.note, user.id);
          persist(queueRef.current.filter((q) => q.id !== item.id));
        } catch (e) {
          const code = codeOf(e);
          if (!isFinal(code)) break;
          persist(queueRef.current.filter((q) => q.id !== item.id));
          setFailed((f) => [...f, { id: item.id, itemId: item.itemId, code }]);
        }
      }
    } finally {
      flushing.current = false;
      setSyncing(false);
      await load();
    }
  }, [repository, user, persist, load]);

  useEffect(() => {
    const kept = vKey ? readView(vKey) : null;
    setServer(kept);
    setStatus(kept ? 'ready' : 'loading');
    void load().then(() => flush());
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, flush, vKey]);
  useEffect(() => {
    if (isOnline) void flush();
  }, [isOnline, flush]);
  // A capture made here is on the installation checklist's queue: when that has gone through, the checks read the proof from the server too.
  useEffect(() => {
    if (work.queue.length === 0) void load();
  }, [work.queue.length, load]);

  const enqueue = useCallback(
    (itemId: string, input: SafetyQueueInput) => {
      if (!jobId) return;
      persist([...queueRef.current, { ...input, id: newId(), jobId, itemId, capturedAt: new Date().toISOString() } as SafetyQueueItem]);
      void flush();
    },
    [jobId, persist, flush],
  );

  const applied = useMemo(() => (server && user ? applySafetyQueue(server, queue, { id: user.id, name: user.name }) : null), [server, queue, user]);

  /** The checks with the phone's own evidence laid over what the server knows: a capture just made is proof at once. */
  const view: SafetyChecklistView | null = useMemo(() => {
    if (!applied) return null;
    const sop = work.local?.view;
    const items = applied.view.items.map((i): SafetyItemView => {
      const slots = i.slots.map((sl): SafetySlotView => {
        const local = sop?.steps.find((s) => s.id === sl.stepId)?.slots.find((x) => x.id === sl.id);
        return local ? { ...sl, proof: local.photo ?? sl.proof, excepted: !!local.exception || sl.excepted } : sl;
      });
      const missing = slots.filter((sl) => !sl.proof && !sl.excepted).map((sl) => sl.id);
      const passProblem = i.waitingFor.length > 0 ? ('depends_on' as const) : missing.length > 0 ? ('evidence_missing' as const) : null;
      return { ...i, slots, missingSlotIds: missing, passProblem: i.requiresReading && !passProblem ? null : passProblem };
    });
    const cleared = items.filter((x) => isCleared(x.state)).length;
    return { ...applied.view, items, progress: { cleared, total: items.length }, blocksQc: cleared < items.length };
  }, [applied, work.local?.view]);

  const guard = async (fn: () => Promise<unknown>, okKey?: string): Promise<ActionResult> => {
    setBusy(true);
    try {
      await fn();
      await load();
      if (okKey) push(t(okKey), 'success');
      return { ok: true };
    } catch (e) {
      return { ok: false, code: codeOf(e) };
    } finally {
      setBusy(false);
    }
  };

  const pass = (itemId: string, measured: string) => {
    enqueue(itemId, { kind: 'result', result: 'pass', ...(measured.trim() ? { measured: measured.trim() } : {}) });
    push(t(isOnline ? K.toast.passed : K.toast.queued), 'success');
  };
  const fail = (itemId: string, note: string) => {
    enqueue(itemId, { kind: 'result', result: 'fail', note: note.trim() });
    push(t(isOnline ? K.toast.failed : K.toast.queued), 'success');
  };
  const fix = (itemId: string, fixKind: SafetyFixKind, note: string) => {
    enqueue(itemId, { kind: 'fix', fixKind, note: note.trim() });
    push(t(isOnline ? (fixKind === 'needs_rework' ? K.toast.reworkHeld : K.toast.fixed) : K.toast.queued), 'success');
  };

  return {
    status,
    reload: () => {
      setStatus('loading');
      void load();
    },
    view,
    pending: applied?.pending ?? new Set<string>(),
    sop: work.local?.view ?? null,
    isAdmin: !!isAdmin,
    isOnline,
    syncing,
    busy,
    queue: queue.filter((q) => q.jobId === jobId),
    failed,
    dismissFailed: () => setFailed([]),
    videoAtRisk: work.videoAtRisk,
    pass,
    fail,
    fix,
    keepEvidence: work.addEvidence,
    disagree: (itemId: string, note: string) => guard(() => repository.raiseSafetyDisagreement(jobId ?? '', itemId, note, user?.id ?? ''), K.toast.disagreed),
    release: (itemId: string, note: string) => guard(() => repository.releaseSafetyHold(jobId ?? '', itemId, note, user?.id ?? ''), K.toast.released),
    override: (itemId: string, engineer: string, reason: string) => guard(() => repository.overrideSafetyItem(jobId ?? '', itemId, engineer, reason, user?.id ?? ''), K.toast.overridden),
    resolve: (itemId: string, decision: 'method_stands' | 'method_changed', note: string) => guard(() => repository.resolveSafetyDisagreement(jobId ?? '', itemId, decision, note, user?.id ?? ''), K.toast.resolved),
    stateItems,
    loadStateItems: async () => {
      if (user) setStateItems(await repository.listSafetyStateItems(user.id));
    },
    addStateItem: (input: { state: string; label: string; method: string; requiresReading: boolean }) =>
      guard(async () => {
        await repository.addSafetyStateItem(input, user?.id ?? '');
        setStateItems(await repository.listSafetyStateItems(user?.id ?? ''));
      }, K.toast.stateAdded),
    toggleStateItem: (id: string, active: boolean) =>
      guard(async () => {
        await repository.setSafetyStateItemActive(id, active, user?.id ?? '');
        setStateItems(await repository.listSafetyStateItems(user?.id ?? ''));
      }),
    readSummary: (summaryId?: string): Promise<PreInspectionSummaryView> => repository.getPreInspectionSummary(jobId ?? '', user?.id ?? '', summaryId),
    generateSummary: async (): Promise<PreInspectionSummaryView | null> => {
      try {
        const s = await repository.generatePreInspectionSummary(jobId ?? '', user?.id ?? '');
        await load();
        push(t(K.toast.summary), 'success');
        return s;
      } catch {
        return null;
      }
    },
    toJob: () => (user?.role === 'admin' ? navigate(-1) : navigate(jobPath(jobId ?? ''))),
    goto: (path: string) => navigate(path),
    jobId: jobId ?? '',
  };
}
