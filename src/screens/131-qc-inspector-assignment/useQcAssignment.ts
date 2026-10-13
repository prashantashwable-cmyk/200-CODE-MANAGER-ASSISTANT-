import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { QcBoardView, QcCandidateView, QcJobDetail } from '@/data/repository';
import type { QcWindow } from '@/data/types';
import { matchesPreference } from '@/features/qc/inspectors';
import type { QcStatus } from './qc-assignment.types';
import { EXCEPTION_MIN, POLL_MS, QC_KEYS as K, draftKey, viewKey } from './qc-assignment.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
export interface Draft {
  selected: string;
  exceptionNote: string;
  adminReason: string;
  prefDates: string[];
  prefWindow: QcWindow | 'any';
  prefNote: string;
  visitDate: string;
  visitWindow: QcWindow;
  agreed: boolean;
}
const EMPTY: Draft = { selected: '', exceptionNote: '', adminReason: '', prefDates: [''], prefWindow: 'any', prefNote: '', visitDate: '', visitWindow: 'morning', agreed: false };

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

export type QcState = ReturnType<typeof useQcAssignment>;

/**
 * Screen 131. Naming the person who checks a finished installation, independently of the people who did it. The eligibility rules are the
 * pure ones in `@/features/qc/inspectors` (the same skill tags technician onboarding records; nobody who took part in the installation),
 * read by the repository too. Admin picks from candidates who show why they can or cannot be named, agrees a time with the customer that
 * no double booking can defeat, and may do the check themself as a documented exception when nobody qualified and independent is free.
 * The form's selections are kept on the device as they are made.
 */
export function useQcAssignment() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const dKey = user && jobId && isAdmin ? draftKey(user.id, jobId) : '';
  const vKey = user && jobId ? viewKey(user.id, jobId) : '';
  const [detail, setDetail] = useState<QcJobDetail | null>(() => (vKey ? readJson<QcJobDetail>(vKey) : null));
  const [board, setBoard] = useState<QcBoardView | null>(null);
  const [status, setStatus] = useState<QcStatus>(() => (detail || !jobId ? 'loading' : 'loading'));
  const [draft, setDraftState] = useState<Draft>(() => ({ ...EMPTY, ...(dKey ? (readJson<Partial<Draft>>(dKey) ?? {}) : {}) }));
  const [restored, setRestored] = useState<boolean>(() => !!(dKey && readJson(dKey)));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [busy, setBusy] = useState(false);

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

  const load = useCallback(async () => {
    if (!user || !navigator.onLine) return;
    try {
      if (jobId) {
        const fresh = await repository.getQcJob(jobId, user.id);
        setDetail(fresh);
        try {
          localStorage.setItem(viewKey(user.id, jobId), JSON.stringify({ ...fresh, briefing: fresh.briefing ? { ...fresh.briefing, steps: fresh.briefing.steps.map((s) => ({ ...s, evidence: [] })) } : null }));
        } catch {
          // Not cached.
        }
      } else setBoard(await repository.getQcBoard(user.id));
      setStatus('ready');
    } catch (e) {
      const code = codeOf(e);
      if (code === 'not_found' || code === 'forbidden') setStatus('not_found');
      else setStatus((c) => (c === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId]);

  useEffect(() => {
    setDetail(vKey ? readJson<QcJobDetail>(vKey) : null);
    setBoard(null);
    setStatus('loading');
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, vKey]);
  useEffect(() => {
    if (isOnline) void load();
  }, [isOnline, load]);

  // What has been chosen and typed is kept, so an interrupted assignment is not lost.
  useEffect(() => {
    if (!dKey) return;
    try {
      if (JSON.stringify(draft) === JSON.stringify(EMPTY)) localStorage.removeItem(dKey);
      else localStorage.setItem(dKey, JSON.stringify(draft));
    } catch {
      // Not kept.
    }
  }, [dKey, draft]);

  const setDraft = (patch: Partial<Draft>) => {
    setRestored(false);
    setDraftState((d) => ({ ...d, ...patch }));
  };
  const clearDraft = (keys: (keyof Draft)[]) => setDraftState((d) => ({ ...d, ...Object.fromEntries(keys.map((k) => [k, EMPTY[k]])) }));

  const selected: QcCandidateView | null = useMemo(() => detail?.candidates.find((c) => c.userId === draft.selected) ?? null, [detail, draft.selected]);
  const onlyMissingSkill = !!selected && !selected.eligible && selected.problems.every((p) => p === 'missing_skill');
  const canAssign = !!detail?.canAssign && !!selected && (selected.eligible || (onlyMissingSkill && draft.exceptionNote.trim().length >= EXCEPTION_MIN));
  const adminValid = !!detail?.canAssign && draft.adminReason.trim().length >= EXCEPTION_MIN;
  const matchesPref = matchesPreference(detail?.preference ? { dates: detail.preference.dates, window: detail.preference.window } : undefined, draft.visitDate, draft.visitWindow);
  const canBook = !!detail?.canSchedule && /^\d{4}-\d{2}-\d{2}$/.test(draft.visitDate) && (matchesPref || draft.agreed);
  const prefValid = draft.prefDates.some((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));

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
  const jid = jobId ?? '';

  return {
    status,
    reload: () => {
      setStatus('loading');
      void load();
    },
    isAdmin: !!isAdmin,
    userId: uid,
    jobId: jobId ?? null,
    detail,
    board,
    isOnline,
    busy,
    draft,
    setDraft,
    restored,
    selected,
    onlyMissingSkill,
    canAssign,
    adminValid,
    canBook,
    matchesPref,
    prefValid,
    assign: async () => {
      if (!selected) return { ok: false, code: 'generic' } as ActionResult;
      const r = await guard(async () => {
        const d = await repository.assignQcInspector(jid, { inspectorId: selected.userId, ...(onlyMissingSkill ? { exceptionNote: draft.exceptionNote } : {}) }, uid);
        setDetail(d);
      }, K.inspector.toast);
      if (r.ok) clearDraft(['selected', 'exceptionNote']);
      return r;
    },
    assignAdmin: async () => {
      const r = await guard(async () => setDetail(await repository.assignAdminAsInspector(jid, draft.adminReason, uid)), K.inspector.toastAdmin);
      if (r.ok) clearDraft(['adminReason']);
      return r;
    },
    reassign: (input: { inspectorId: string; reason: string; exceptionNote?: string }) => guard(async () => setDetail(await repository.reassignQcInspector(jid, input, uid)), K.assigned.toastReassigned),
    savePreference: async () => {
      const dates = draft.prefDates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
      const r = await guard(async () => setDetail(await repository.recordQcPreference(jid, { dates, window: draft.prefWindow, ...(draft.prefNote.trim() ? { note: draft.prefNote } : {}) }, uid)), K.pref.toast);
      if (r.ok) clearDraft(['prefDates', 'prefWindow', 'prefNote']);
      return r;
    },
    book: async () => {
      const r = await guard(async () => setDetail(await repository.scheduleQcVisit(jid, { date: draft.visitDate, window: draft.visitWindow, customerAgreed: draft.agreed || matchesPref }, uid)), K.visit.toast);
      if (r.ok) clearDraft(['visitDate', 'visitWindow', 'agreed']);
      return r;
    },
    reportConflict: (note: string) => guard(async () => setDetail(await repository.reportQcConflict(jid, note, uid)), K.conflict.toastReported),
    clearConflict: (note: string) => guard(async () => setDetail(await repository.clearQcConflict(jid, note, uid)), K.conflict.toastCleared),
    addOff: (input: { userId?: string; date: string; window: QcWindow | 'all'; reason: string }) => guard(() => repository.setInspectorUnavailable(input, uid), K.mine.toastOff),
    removeOff: (id: string) => guard(() => repository.clearInspectorUnavailable(id, uid)),
    goto: (path: string) => navigate(path),
  };
}
