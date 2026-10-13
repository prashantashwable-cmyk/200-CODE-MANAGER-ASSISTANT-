import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { QcMechInput, QcMechView, SopMediaInput } from '@/data/repository';
import type { QcMechItemId, QcVerdict } from '@/data/types';
import { MEASURES_OF, attemptProblem, hasFloors, hasRubric, suggestVerdict } from '@/features/qc/mechanical';
import type { AttemptProblem, Reading } from '@/features/qc/mechanical';
import type { MechStatus } from './qc-mechanical.types';
import { FINAL_ERRORS, MECH_KEYS as K, POLL_MS, draftKey, outboxKey, viewKey } from './qc-mechanical.types';
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
  floors: string[];
  rubric: 1 | 2 | 3 | null;
  /** Null means "as the reference says": the person only picks a verdict to differ from it. */
  verdict: QcVerdict | null;
  note: string;
  override: string;
  attachments: Attachment[];
}
interface OutItem {
  id: string;
  jobId: string;
  itemId: QcMechItemId;
  verdict: QcVerdict;
  measures: { key: string; value: number }[];
  floors: { floor: number; mm: number }[];
  rubric?: 1 | 2 | 3;
  note?: string;
  overrideReason?: string;
  media: Attachment[];
  capturedAt: string;
}

const newId = (): string => newClientId();
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
const isFinal = (c: string) => (FINAL_ERRORS as readonly string[]).includes(c);
const hasVideo = (q: OutItem) => q.media.some((m) => m.media.kind === 'video');
/** Clips are too big for the phone's small storage: they are held while the app stays open. */
const volatile = new Map<string, OutItem[]>();

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
const emptyForm = (floors: number): ItemForm => ({ measures: {}, floors: Array.from({ length: floors }, () => ''), rubric: null, verdict: null, note: '', override: '', attachments: [] });
const num = (s: string) => (s.trim() === '' ? NaN : Number(s));

/** What a form says as a reading and as the verdict it will be recorded with. */
export function readingOf(id: QcMechItemId, f: ItemForm): Reading {
  return {
    measures: MEASURES_OF[id].map((k) => ({ key: k, value: num(f.measures[k] ?? '') })).filter((m) => Number.isFinite(m.value)),
    floors: f.floors.map((v, i) => ({ floor: i + 1, mm: num(v) })).filter((x) => Number.isFinite(x.mm)),
    ...(f.rubric ? { rubric: f.rubric } : {}),
  };
}

export type MechState = ReturnType<typeof useQcMechanical>;

/**
 * Screen 132. The inspector's mechanical checklist: five checks that mirror a lift inspector's trial run. Each measurable one is read
 * against a reference threshold, so the verdict does not rest on individual judgment (a softer verdict than the reference gives needs a
 * reason); a fail needs a picture or clip and words and goes straight to rework; a pass with a noted exception waits for Admin; and the
 * inspector cross-checks each item against what was logged when it was installed, raising any difference as a finding that has to be
 * explained. Recordings are kept on the phone and sent when there is signal.
 */
export function useQcMechanical() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const oKey = user ? outboxKey(user.id) : '';
  const vKey = user && jobId ? viewKey(user.id, jobId) : '';
  const dKey = user && jobId ? draftKey(user.id, jobId) : '';
  const [server, setServer] = useState<QcMechView | null>(() => (vKey ? readJson<QcMechView>(vKey) : null));
  const [status, setStatus] = useState<MechStatus>(() => (server || !jobId ? 'ready' : 'loading'));
  const [outbox, setOutbox] = useState<OutItem[]>(() => (oKey ? [...(readJson<OutItem[]>(oKey) ?? []), ...(volatile.get(oKey) ?? [])] : []));
  const [forms, setForms] = useState<Partial<Record<QcMechItemId, ItemForm>>>(() => (dKey ? (readJson<Partial<Record<QcMechItemId, ItemForm>>>(dKey) ?? {}) : {}));
  const [restored, setRestored] = useState<boolean>(() => !!(dKey && readJson(dKey)));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<{ id: string; itemId: QcMechItemId; code: string }[]>([]);
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
      const fresh = await repository.getMechanicalCheck(jobId, user.id);
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
          const input: QcMechInput = { verdict: q.verdict, measures: q.measures, floors: q.floors, ...(q.rubric ? { rubric: q.rubric } : {}), ...(q.note ? { note: q.note } : {}), ...(q.overrideReason ? { overrideReason: q.overrideReason } : {}), evidence: q.media.map((m) => ({ ...m.media, capturedAt: m.takenAt })), clientId: q.id, capturedAt: q.capturedAt };
          await repository.recordMechanicalResult(q.jobId, q.itemId, input, user.id);
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
    setServer(vKey ? readJson<QcMechView>(vKey) : null);
    void load().then(() => flush());
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, flush, vKey]);
  useEffect(() => {
    if (isOnline) void flush();
  }, [isOnline, flush]);

  // What has been typed is kept as it is typed (pictures are not: they are too big, and are kept when the item is recorded).
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

  const floors = server?.floors ?? 0;
  const formOf = (id: QcMechItemId): ItemForm => forms[id] ?? emptyForm(floors);
  const setForm = (id: QcMechItemId, patch: Partial<ItemForm>) => {
    setRestored(false);
    setForms((all) => ({ ...all, [id]: { ...(all[id] ?? emptyForm(floors)), ...patch } }));
  };
  const reading = (id: QcMechItemId) => readingOf(id, formOf(id));
  const suggested = (id: QcMechItemId): QcVerdict | null => suggestVerdict(id, reading(id), floors);
  const verdictOf = (id: QcMechItemId): QcVerdict | null => formOf(id).verdict ?? suggested(id);
  const problemOf = (id: QcMechItemId): AttemptProblem | null => {
    const f = formOf(id);
    const v = verdictOf(id);
    if (!v) return 'reading_incomplete';
    return attemptProblem({ itemId: id, verdict: v, reading: reading(id), floorCount: floors, note: f.note, evidenceCount: f.attachments.length, overrideReason: f.override });
  };

  const mine = useMemo(() => outbox.filter((o) => o.jobId === jobId), [outbox, jobId]);

  const record = (id: QcMechItemId) => {
    const v = verdictOf(id);
    if (!v || problemOf(id) || !jobId) return;
    const f = formOf(id);
    const r = reading(id);
    persist([...outRef.current, { id: newId(), jobId, itemId: id, verdict: v, measures: r.measures, floors: r.floors, ...(r.rubric ? { rubric: r.rubric } : {}), ...(f.note.trim() ? { note: f.note.trim() } : {}), ...(f.override.trim() ? { overrideReason: f.override.trim() } : {}), media: f.attachments, capturedAt: new Date().toISOString() }]);
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
    userId: uid,
    view: server,
    isOnline,
    busy,
    waiting: mine.length,
    pendingItems: new Set(mine.map((m) => m.itemId)),
    failed,
    dismissFailed: () => setFailed([]),
    forms,
    formOf,
    setForm,
    restored,
    reading,
    suggested,
    verdictOf,
    problemOf,
    record,
    hasFloors,
    hasRubric,
    raise: (itemId: QcMechItemId, description: string) => guard(() => repository.raiseInstallDiscrepancy(jobId ?? '', itemId, description, uid), K.compare.toastRaised),
    explain: (findingId: string, text: string) => guard(() => repository.explainDiscrepancy(findingId, text, uid), K.finding.toastExplained),
    accept: (findingId: string) => guard(() => repository.acceptDiscrepancy(findingId, uid), K.finding.toastAccepted),
    review: (itemId: QcMechItemId, decision: 'accept' | 'reject', note: string) => guard(() => repository.reviewMechanicalException(jobId ?? '', itemId, decision, note, uid), decision === 'accept' ? K.review.toastAccepted : K.review.toastRejected),
    signOff: () => guard(() => repository.signOffMechanical(jobId ?? '', uid), K.signOff.toast),
    goto: (path: string) => navigate(path),
  };
}
