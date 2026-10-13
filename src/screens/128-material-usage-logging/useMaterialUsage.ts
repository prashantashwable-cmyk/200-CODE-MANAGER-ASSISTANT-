import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { MaterialBoardView, MaterialLogView, MaterialPlanLine } from '@/data/repository';
import type { JobMaterialUse, LeftoverAction, MaterialIdentifier } from '@/data/types';
import { identifierKind, isMajor, logProblems, rowProblem } from '@/features/technician/materials';
import type { MaterialProblem } from '@/features/technician/materials';
import type { MaterialStatus } from './material-usage.types';
import { FINAL_ERRORS, MATERIAL_KEYS as K, POLL_MS, draftKey, viewKey } from './material-usage.types';
import { newClientId } from '@/features/ids/clientId';

export type Mode = 'planned' | 'part' | 'none';
export interface ActionResult {
  ok: boolean;
  code?: string;
}
interface Draft {
  rows: JobMaterialUse[];
  dirty: boolean;
  /** Set when the person confirmed without signal: the rows are sent as a confirmation, at the time they said so, when the phone is online. */
  pendingConfirm?: string;
}

const newId = (): string => newClientId('mu-');
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
const isFinal = (code: string) => (FINAL_ERRORS as readonly string[]).includes(code);
function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** How many serial numbers (or batch numbers) a row needs written down: one per unit for a traced part, one batch for ropes, none from stock. */
export const identifiersNeeded = (u: Pick<JobMaterialUse, 'category' | 'usedQty' | 'source'>): number => {
  if (u.usedQty <= 0 || u.source === 'stock') return 0;
  const kind = identifierKind(u.category);
  return kind === 'none' ? 0 : kind === 'batch' ? 1 : u.usedQty;
};

/** A row always carries exactly as many identifier slots as it needs, so the form never asks for a number that is not wanted. */
function fitIdentifiers(u: JobMaterialUse): JobMaterialUse {
  const need = identifiersNeeded(u);
  const have = u.identifiers.slice(0, need);
  while (have.length < need) have.push({ legible: true });
  return { ...u, identifiers: have };
}

export const modeOf = (u: JobMaterialUse): Mode => (u.usedQty === 0 ? 'none' : u.usedQty === u.plannedQty && u.leftoverQty === 0 ? 'planned' : 'part');

export type MaterialState = ReturnType<typeof useMaterialUsage>;

/**
 * Screen 128. The lead technician writes down what was actually put in the lift, against the bill of materials it was planned with: each planned
 * part was used as planned, used in part, or not used, and anything else that went in (a substitute, an extra, a small part from the technician's
 * own stock) is its own kind of row. Every departure has a reason; a serial or batch number that cannot be read is said to be unreadable, never
 * invented; leftovers say where they go, including back into a reusable pool for a nearby job. What is typed is kept on the phone as it is typed
 * and sent to the job when there is signal. Admin reads the same record with its costs, and sees which suppliers' parts keep being replaced.
 */
export function useMaterialUsage() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const dKey = user && jobId && !isAdmin ? draftKey(user.id, jobId) : '';
  const vKey = user && jobId ? viewKey(user.id, jobId) : '';

  const [server, setServer] = useState<MaterialLogView | null>(() => (vKey ? readJson<MaterialLogView>(vKey) : null));
  const [board, setBoard] = useState<MaterialBoardView | null>(null);
  const [status, setStatus] = useState<MaterialStatus>(() => (server ? 'ready' : jobId || isAdmin ? 'loading' : 'ready'));
  const initialDraft = dKey ? readJson<Draft>(dKey) : null;
  const [rows, setRowsState] = useState<JobMaterialUse[]>(() => initialDraft?.rows ?? server?.uses ?? []);
  const [dirty, setDirty] = useState<boolean>(!!initialDraft?.dirty);
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(initialDraft?.pendingConfirm ?? null);
  const [draftRestored, setDraftRestored] = useState<boolean>(!!initialDraft?.dirty);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const pendingRef = useRef(pendingConfirm);
  pendingRef.current = pendingConfirm;
  const sendingRef = useRef(false);

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
        const fresh = await repository.getMaterialLog(jobId, user.id);
        setServer(fresh);
        try {
          localStorage.setItem(viewKey(user.id, jobId), JSON.stringify(fresh));
        } catch {
          // Not cached.
        }
        // What is on the job is what is shown, unless this phone holds words the job has not seen yet.
        if (!dirtyRef.current && !pendingRef.current) setRowsState(fresh.uses);
      } else if (isAdmin) setBoard(await repository.getMaterialBoard(user.id));
      setStatus('ready');
    } catch (e) {
      const code = codeOf(e);
      if (code === 'not_found' || code === 'forbidden') setStatus('not_found');
      else setStatus((c) => (c === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId, isAdmin]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);

  // What has been typed is kept as it is typed.
  useEffect(() => {
    if (!dKey) return;
    try {
      if (!dirty && !pendingConfirm) localStorage.removeItem(dKey);
      else localStorage.setItem(dKey, JSON.stringify({ rows, dirty, ...(pendingConfirm ? { pendingConfirm } : {}) } satisfies Draft));
    } catch {
      // Not kept on the phone; it is still held while the screen is open.
    }
  }, [dKey, rows, dirty, pendingConfirm]);

  const plan: MaterialPlanLine[] = useMemo(() => server?.planned ?? [], [server]);
  const plannedIds = useMemo(() => plan.map((p) => p.id), [plan]);
  const editable = !!server?.canEdit && !isAdmin;

  const problemsAll = useMemo(() => logProblems(rows, plannedIds, true), [rows, plannedIds]);
  const problemsOf = useCallback((key: string): MaterialProblem | null => problemsAll.find((p) => p.key === key)?.problem ?? null, [problemsAll]);
  const unanswered = useMemo(() => plan.filter((p) => !rows.some((r) => r.lineItemId === p.id)), [plan, rows]);
  const rowsWithProblems = useMemo(() => problemsAll.filter((p) => p.problem !== 'line_missing').length, [problemsAll]);
  const valid = editable && rows.length > 0 && problemsAll.length === 0;

  const setRows = useCallback((next: JobMaterialUse[]) => {
    rowsRef.current = next;
    setRowsState(next);
    setDirty(true);
    setDraftRestored(false);
    setFailed(null);
  }, []);

  /* ---------------------------------------------------------- sending to the job */

  const send = useCallback(
    async (confirm: boolean, capturedAt?: string): Promise<ActionResult> => {
      if (!user || !jobId || sendingRef.current) return { ok: false, code: 'generic' };
      sendingRef.current = true;
      setSending(true);
      const snapshot = rowsRef.current;
      try {
        const next = await repository.saveMaterialLog(jobId, { uses: snapshot, confirm, ...(capturedAt ? { capturedAt } : {}) }, user.id);
        setServer(next);
        // Only what was sent is now on the job: words typed since then stay.
        if (rowsRef.current === snapshot) {
          setDirty(false);
          setPendingConfirm(null);
          if (confirm || next.status === 'confirmed') setRowsState(next.uses);
        } else if (confirm) setPendingConfirm(null);
        return { ok: true };
      } catch (e) {
        const code = codeOf(e);
        if (isFinal(code)) {
          setPendingConfirm(null);
          setFailed(code);
        }
        return { ok: false, code };
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [repository, user, jobId],
  );

  // Draft to the job: only when every row that is there is at least well formed, and only while there is signal.
  useEffect(() => {
    if (!editable || !dirty || pendingConfirm || !isOnline) return;
    if (logProblems(rows, plannedIds, false).length > 0) return;
    const timer = window.setTimeout(() => void send(false), 1500);
    return () => window.clearTimeout(timer);
  }, [editable, dirty, pendingConfirm, isOnline, rows, plannedIds, send]);

  // A confirmation made without signal is sent, at the time it was made, once there is.
  useEffect(() => {
    if (!editable || !pendingConfirm || !isOnline) return;
    void send(true, pendingConfirm).then((r) => {
      if (r.ok) void load();
    });
  }, [editable, pendingConfirm, isOnline, send, load]);

  /* ---------------------------------------------------------- editing */

  const patchRow = useCallback(
    (id: string, patch: Partial<JobMaterialUse>) => {
      setRows(rowsRef.current.map((r) => (r.id === id ? fitIdentifiers({ ...r, ...patch }) : r)));
    },
    [setRows],
  );

  /** Says how a planned part was used. Switching resets what depended on the old answer, but keeps a reason already written. */
  const answer = useCallback(
    (line: MaterialPlanLine, mode: Mode) => {
      const prev = rowsRef.current.find((r) => r.lineItemId === line.id);
      const base: JobMaterialUse = {
        id: prev?.id ?? newId(),
        source: 'delivered',
        lineItemId: line.id,
        poCode: line.poCode,
        ...(line.supplierId ? { supplierId: line.supplierId } : {}),
        category: line.category,
        description: line.description,
        plannedQty: line.quantity,
        usedQty: line.quantity,
        leftoverQty: 0,
        identifiers: prev?.identifiers ?? [],
        ...(line.state !== 'on_site' ? { deliveryUnconfirmed: true } : {}),
      };
      const kept = prev?.deviation?.reason ?? '';
      let row: JobMaterialUse;
      if (mode === 'planned') row = base;
      else if (mode === 'part') row = { ...base, usedQty: Math.max(1, line.quantity - 1), leftoverQty: 1, leftoverAction: 'return_to_pool' };
      else row = { ...base, usedQty: 0, leftoverQty: line.quantity, identifiers: [], deviation: { kind: 'defective_replaced', reason: kept } };
      const next = fitIdentifiers(row);
      setRows(prev ? rowsRef.current.map((r) => (r.id === prev.id ? next : r)) : [...rowsRef.current, next]);
    },
    [setRows],
  );

  const setQuantities = useCallback(
    (id: string, used: number, leftover: number) => {
      const r = rowsRef.current.find((x) => x.id === id);
      if (!r) return;
      const u = Math.min(Math.max(0, used), r.plannedQty);
      const l = Math.min(Math.max(0, leftover), Math.max(0, r.plannedQty - u));
      const short = u + l < r.plannedQty;
      // A part used in part, with what is left over all accounted for, needs no explanation: only what is missing does.
      const deviation = short || u === 0 ? (r.deviation ?? { kind: 'unsuitable' as const, reason: '' }) : undefined;
      patchRow(id, { usedQty: u, leftoverQty: l, ...(l > 0 ? { leftoverAction: r.leftoverAction ?? ('return_to_pool' as LeftoverAction) } : { leftoverAction: undefined }), deviation });
    },
    [patchRow],
  );

  const setIdentifier = useCallback(
    (id: string, index: number, patch: Partial<MaterialIdentifier>) => {
      const r = rowsRef.current.find((x) => x.id === id);
      if (!r) return;
      const ids = r.identifiers.map((i, n) => (n === index ? { ...i, ...patch } : i));
      patchRow(id, { identifiers: ids });
    },
    [patchRow],
  );

  const addExtra = useCallback(
    (kind: 'substitute' | 'extra_needed', replacesLineItemId?: string) => {
      const row: JobMaterialUse = { id: newId(), source: 'stock', category: 'small_parts', description: '', plannedQty: 0, usedQty: 1, leftoverQty: 0, identifiers: [], deviation: { kind, reason: '', ...(replacesLineItemId ? { replacesLineItemId } : {}) } };
      setRows([...rowsRef.current, row]);
    },
    [setRows],
  );
  const removeRow = useCallback((id: string) => setRows(rowsRef.current.filter((r) => r.id !== id)), [setRows]);

  /** A part from the technician's own stock can only be a small one: choosing a major category moves the row to "bought locally". */
  const setExtraCategory = useCallback(
    (id: string, category: string) => {
      const r = rowsRef.current.find((x) => x.id === id);
      if (!r) return;
      patchRow(id, { category, source: r.source === 'stock' && isMajor(category) ? 'local_purchase' : r.source });
    },
    [patchRow],
  );

  const confirm = useCallback(async (): Promise<ActionResult> => {
    if (!valid) return { ok: false, code: 'generic' };
    const at = new Date().toISOString();
    if (!navigator.onLine) {
      setPendingConfirm(at);
      push(t(K.confirm.toastQueued), 'success');
      return { ok: true };
    }
    const r = await send(true, at);
    if (r.ok) {
      push(t(K.confirm.toast), 'success');
      await load();
    } else if (!isFinal(r.code ?? '')) {
      // The network dropped between the check and the send: it is kept and goes when the signal is back.
      setPendingConfirm(at);
      push(t(K.confirm.toastQueued), 'success');
    }
    return r;
  }, [valid, send, load, push, t]);

  const saveDraftNow = useCallback(async () => {
    const r = await send(false);
    if (r.ok) push(t(K.confirm.toastDraft), 'success');
    return r;
  }, [send, push, t]);

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
  const uid = user?.id ?? '';

  return {
    status,
    reload: () => {
      setStatus('loading');
      void load();
    },
    isAdmin: !!isAdmin,
    jobId: jobId ?? null,
    view: server,
    board,
    rows,
    plan,
    editable,
    isOnline,
    sending,
    dirty,
    pendingConfirm,
    draftRestored,
    failed,
    dismissFailed: () => setFailed(null),
    busy,
    valid,
    unanswered,
    rowsWithProblems,
    problemsAll,
    problemOf: problemsOf,
    rowProblem: (u: JobMaterialUse) => rowProblem(u, plannedIds),
    answer,
    setQuantities,
    patchRow,
    setIdentifier,
    addExtra,
    removeRow,
    setExtraCategory,
    confirm,
    saveDraftNow,
    reopen: (reason: string) => guard(() => repository.reopenMaterialLog(jobId ?? '', reason, uid), K.admin.toastReopened),
    goto: (path: string) => navigate(path),
  };
}
