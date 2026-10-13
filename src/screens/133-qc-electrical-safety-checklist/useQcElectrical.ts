import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { QcElecInput, QcElecView, SopMediaInput } from '@/data/repository';
import type { QcElecItemId } from '@/data/types';
import { attemptProblem, defOf, suggestVerdict } from '@/features/qc/electrical';
import type { ElecProblem, ElecReading } from '@/features/qc/electrical';
import type { ElecStatus } from './qc-electrical.types';
import { FINAL_ERRORS, ELEC_KEYS as K, POLL_MS, draftKey, outboxKey, viewKey } from './qc-electrical.types';
import { newClientId } from '@/features/ids/clientId';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
export interface Attachment {
  media: Omit<SopMediaInput, 'capturedAt'>;
  takenAt: string;
}
export interface ItemForm {
  measures: Record<string, string>;
  /** Missing means not answered yet. */
  checks: Record<string, boolean>;
  intermittent: boolean;
  /** Only ever "fail" by choice: a pass is what the readings say, never chosen over them. */
  forceFail: boolean;
  note: string;
  attachments: Attachment[];
}
interface OutItem {
  id: string;
  jobId: string;
  itemId: QcElecItemId;
  verdict: 'pass' | 'fail';
  measures: { key: string; value: number }[];
  checks: { key: string; ok: boolean }[];
  intermittent: boolean;
  note?: string;
  media: Attachment[];
  capturedAt: string;
}

const newId = (): string => newClientId();
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
const isFinal = (c: string) => (FINAL_ERRORS as readonly string[]).includes(c);
const hasVideo = (q: OutItem) => q.media.some((m) => m.media.kind === 'video');
const volatile = new Map<string, OutItem[]>();
const EMPTY: ItemForm = { measures: {}, checks: {}, intermittent: false, forceFail: false, note: '', attachments: [] };

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
const num = (s: string) => (s.trim() === '' ? NaN : Number(s));

export function readingOf(id: QcElecItemId, f: ItemForm): ElecReading {
  const d = defOf(id);
  return {
    measures: d.measures.map((m) => ({ key: m.key, value: num(f.measures[m.key] ?? '') })).filter((m) => Number.isFinite(m.value)),
    checks: d.checks.filter((c) => c in f.checks).map((c) => ({ key: c, ok: f.checks[c] })),
    intermittent: f.intermittent,
  };
}

export type ElecState = ReturnType<typeof useQcElectrical>;

/**
 * Screen 133. The inspector's electrical and safety checklist: the checks that can hurt someone if they are wrong, ending in the no-load and
 * full-load trial runs. There is no soft pass. A pass is only what the readings say (a reading outside its reference, a check that did not
 * work, or behaviour that was not the same every time is a fail), a fail needs a picture or clip and words and goes to rework, and every attempt is kept: a
 * fail that was put right stays on the record beside the pass that followed. While anything has failed or is open nothing can go on to handover.
 */
export function useQcElectrical() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const oKey = user ? outboxKey(user.id) : '';
  const vKey = user && jobId ? viewKey(user.id, jobId) : '';
  const dKey = user && jobId ? draftKey(user.id, jobId) : '';
  const [server, setServer] = useState<QcElecView | null>(() => (vKey ? readJson<QcElecView>(vKey) : null));
  const [status, setStatus] = useState<ElecStatus>(() => (server || !jobId ? 'ready' : 'loading'));
  const [outbox, setOutbox] = useState<OutItem[]>(() => (oKey ? [...(readJson<OutItem[]>(oKey) ?? []), ...(volatile.get(oKey) ?? [])] : []));
  const [forms, setForms] = useState<Partial<Record<QcElecItemId, ItemForm>>>(() => (dKey ? (readJson<Partial<Record<QcElecItemId, ItemForm>>>(dKey) ?? {}) : {}));
  const [restored, setRestored] = useState<boolean>(() => !!(dKey && readJson(dKey)));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<{ id: string; itemId: QcElecItemId; code: string }[]>([]);
  const outRef = useRef(outbox);
  outRef.current = outbox;
  const flushing = useRef(false);

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
    (next: OutItem[]) => {
      outRef.current = next;
      setOutbox(next);
      if (!oKey) return;
      volatile.set(oKey, next.filter(hasVideo));
      try {
        const keep = next.filter((q) => !hasVideo(q));
        if (keep.length === 0) localStorage.removeItem(oKey);
        else localStorage.setItem(oKey, JSON.stringify(keep));
      } catch {
        // Held while the screen is open.
      }
    },
    [oKey],
  );

  const load = useCallback(async () => {
    if (!user || !jobId || !navigator.onLine) return;
    try {
      const fresh = await repository.getElectricalCheck(jobId, user.id);
      setServer(fresh);
      try {
        localStorage.setItem(viewKey(user.id, jobId), JSON.stringify({ ...fresh, items: fresh.items.map((i) => ({ ...i, reference: i.reference.map((r) => ({ ...r, photos: [] })), attempts: i.attempts.map((a) => ({ ...a, evidence: [] })) })) }));
      } catch {
        // Not cached.
      }
      setStatus('ready');
    } catch (e) {
      const c = codeOf(e);
      if (c === 'not_found' || c === 'forbidden') setStatus('not_found');
      else setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId]);

  const flush = useCallback(async () => {
    if (!user || flushing.current || !navigator.onLine || outRef.current.length === 0) return;
    flushing.current = true;
    try {
      for (const q of [...outRef.current]) {
        try {
          const input: QcElecInput = { verdict: q.verdict, measures: q.measures, checks: q.checks, intermittent: q.intermittent, ...(q.note ? { note: q.note } : {}), evidence: q.media.map((m) => ({ ...m.media, capturedAt: m.takenAt })), clientId: q.id, capturedAt: q.capturedAt };
          await repository.recordElectricalResult(q.jobId, q.itemId, input, user.id);
          persist(outRef.current.filter((x) => x.id !== q.id));
        } catch (e) {
          const c = codeOf(e);
          if (!isFinal(c)) break;
          persist(outRef.current.filter((x) => x.id !== q.id));
          setFailed((f) => [...f, { id: q.id, itemId: q.itemId, code: c }]);
        }
      }
    } finally {
      flushing.current = false;
      await load();
    }
  }, [repository, user, persist, load]);

  useEffect(() => {
    setServer(vKey ? readJson<QcElecView>(vKey) : null);
    void load().then(() => flush());
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, flush, vKey]);
  useEffect(() => {
    if (isOnline) void flush();
  }, [isOnline, flush]);

  useEffect(() => {
    if (!dKey) return;
    const words = Object.fromEntries(Object.entries(forms).map(([k, f]) => [k, { ...f, attachments: [] }]));
    try {
      if (Object.keys(words).length === 0) localStorage.removeItem(dKey);
      else localStorage.setItem(dKey, JSON.stringify(words));
    } catch {
      // Not kept.
    }
  }, [dKey, forms]);

  const formOf = (id: QcElecItemId): ItemForm => forms[id] ?? EMPTY;
  const setForm = (id: QcElecItemId, patch: Partial<ItemForm>) => {
    setRestored(false);
    setForms((all) => ({ ...all, [id]: { ...(all[id] ?? EMPTY), ...patch } }));
  };
  const reading = (id: QcElecItemId) => readingOf(id, formOf(id));
  const suggested = (id: QcElecItemId) => suggestVerdict(id, reading(id));
  /** What will be recorded: what the readings say, or a fail the inspector chose. */
  const verdictOf = (id: QcElecItemId): 'pass' | 'fail' | null => (formOf(id).forceFail ? 'fail' : suggested(id));
  const problemOf = (id: QcElecItemId): ElecProblem | null => {
    const f = formOf(id);
    const v = verdictOf(id);
    if (!v) return 'reading_incomplete';
    return attemptProblem({ itemId: id, verdict: v, reading: reading(id), note: f.note, evidenceCount: f.attachments.length });
  };
  const mine = useMemo(() => outbox.filter((o) => o.jobId === jobId), [outbox, jobId]);

  const record = (id: QcElecItemId) => {
    const v = verdictOf(id);
    if (!v || problemOf(id) || !jobId) return;
    const f = formOf(id);
    const r = reading(id);
    persist([...outRef.current, { id: newId(), jobId, itemId: id, verdict: v, measures: r.measures, checks: r.checks, intermittent: r.intermittent, ...(f.note.trim() ? { note: f.note.trim() } : {}), media: f.attachments, capturedAt: new Date().toISOString() }]);
    setForms((all) => {
      const next = { ...all };
      delete next[id];
      return next;
    });
    push(t(navigator.onLine ? K.form.toast : K.form.toastQueued), 'success');
    void flush();
  };

  const guard = async (fn: () => Promise<unknown>, okKey?: string): Promise<ActionResult> => {
    if (!navigator.onLine) return { ok: false, code: 'offline' };
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
  const uid = user?.id ?? '';

  return {
    status,
    reload: () => {
      setStatus('loading');
      void load();
    },
    jobId: jobId ?? null,
    view: server,
    isOnline,
    busy,
    waiting: mine.length,
    pendingItems: new Set(mine.map((m) => m.itemId)),
    failed,
    dismissFailed: () => setFailed([]),
    formOf,
    setForm,
    restored,
    suggested,
    verdictOf,
    problemOf,
    record,
    signOff: () => guard(() => repository.signOffElectrical(jobId ?? '', uid), K.signOff.toast),
    goto: (path: string) => navigate(path),
  };
}
