import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ChecklistArrival, CompleteChecklistResult, DeliveryChecklistBoard, DeliveryChecklistView } from '@/data/repository';
import type { DeliveryCheckItem, DeliveryReceiverRole } from '@/data/types';
import { kindsOf, problemWith, progressOf } from '@/features/logistics/deliveryChecklist';
import type { ItemProblem } from '@/features/logistics/deliveryChecklist';
import type { DeliveryChecklistStatus } from './delivery-checklist.types';
import { MAX_PHOTOS } from './delivery-checklist.types';

const SOP_SEEN_KEY = 'aiec.sopSeen';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export interface DraftPhoto {
  id?: string;
  fileName: string;
  previewUrl?: string;
  capturedAt: string;
}

/** What someone has said about a part so far — held on the screen until they confirm it. */
export interface ItemDraft {
  arrived: boolean;
  qty: string;
  conditionOk: boolean;
  specOk: boolean;
  note: string;
  photos: DraftPhoto[];
  /** Answers on the centrally governed procedure steps (107), by step id. */
  sop: Record<string, { done: boolean; photo?: DraftPhoto }>;
}

const sopFromItem = (item: DeliveryCheckItem): ItemDraft['sop'] =>
  Object.fromEntries((item.sopResults ?? []).map((r) => [r.stepId, { done: r.done, photo: r.photo ? { id: r.photo.id, fileName: r.photo.fileName, previewUrl: r.photo.previewUrl, capturedAt: r.photo.capturedAt } : undefined }]));

/** A part not yet checked starts from "as expected", so the common case is one photo and one tap. */
export function draftFromItem(item: DeliveryCheckItem): ItemDraft {
  if (item.verdict === 'pending') return { arrived: true, qty: String(item.expectedQty), conditionOk: true, specOk: true, note: '', photos: [], sop: {} };
  return {
    arrived: item.verdict !== 'not_arrived',
    qty: String(item.receivedQty ?? item.expectedQty),
    conditionOk: item.conditionOk !== false,
    specOk: item.specOk !== false,
    note: item.note ?? '',
    photos: item.photos.map((p) => ({ id: p.id, fileName: p.fileName, previewUrl: p.previewUrl, capturedAt: p.capturedAt })),
    sop: sopFromItem(item),
  };
}

export function findingsOf(d: ItemDraft, item: DeliveryCheckItem) {
  const qty = d.qty.trim() === '' ? NaN : Number(d.qty);
  const steps = item.sopSteps ?? [];
  return {
    arrived: d.arrived,
    receivedQty: qty,
    conditionOk: d.conditionOk,
    specOk: d.specOk,
    note: d.note,
    photoCount: d.photos.length,
    sopSteps: steps,
    sopResults: steps.map((st) => ({ stepId: st.id, done: !!d.sop[st.id]?.done, photo: d.sop[st.id]?.photo })),
  };
}

export interface SignOffDraft {
  role: DeliveryReceiverRole;
  name: string;
  phone: string;
  ackName: string;
  note: string;
}

export function useDeliveryChecklist() {
  const repository = useData();
  const { user, role } = useSession();
  const isAdmin = role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const checklistParam = searchParams.get('checklist');
  const poParam = searchParams.get('poId');

  const [status, setStatus] = useState<DeliveryChecklistStatus>('loading');
  const [board, setBoard] = useState<DeliveryChecklistBoard | null>(null);
  const [busy, setBusy] = useState(false);
  /** What the last sign-off did, shown until the person leaves it. */
  const [result, setResult] = useState<CompleteChecklistResult | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBoard(await repository.getDeliveryChecklistBoard(user.id));
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = () => {
    setStatus('loading');
    void load();
  };

  /* ------------------------------------------------------------- the board */
  const arrivals: ChecklistArrival[] = useMemo(() => (board?.arrivals ?? []).filter((a) => !poParam || a.poId === poParam), [board, poParam]);
  const recent = useMemo(() => (board?.checklists ?? []).filter((c) => c.status === 'completed' && (!poParam || c.poId === poParam)), [board, poParam]);
  const filteredToPo = !!poParam;
  const showAll = () => setSearchParams({}, { replace: true });

  /* ------------------------------------------------ the open checklist */
  const open: DeliveryChecklistView | null = useMemo(() => board?.checklists.find((c) => c.id === checklistParam) ?? null, [board, checklistParam]);
  const openChecklist = (id: string) => {
    setResult(null);
    setSearchParams({ checklist: id });
  };
  const closeChecklist = () => {
    setResult(null);
    setSearchParams(poParam ? { poId: poParam } : {}, { replace: false });
  };

  const start = async (arrival: ChecklistArrival): Promise<ActionResult> => {
    if (!user) return { ok: false, code: 'forbidden' };
    if (arrival.checklistId) {
      openChecklist(arrival.checklistId);
      return { ok: true };
    }
    setBusy(true);
    try {
      const created = await repository.startDeliveryChecklist(arrival.poId, arrival.legId, user.id);
      await load();
      openChecklist(created.id);
      return { ok: true };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------------- item drafts */
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [expanded, setExpanded] = useState<string | null | undefined>(undefined);
  const draftKey = (item: DeliveryCheckItem) => `${open?.id ?? ''}:${item.lineItemId}`;
  const draftOf = (item: DeliveryCheckItem): ItemDraft => drafts[draftKey(item)] ?? draftFromItem(item);
  const patchDraft = (item: DeliveryCheckItem, patch: Partial<ItemDraft>) => setDrafts((cur) => ({ ...cur, [draftKey(item)]: { ...(cur[draftKey(item)] ?? draftFromItem(item)), ...patch } }));
  const setPhotos = (item: DeliveryCheckItem, photos: DraftPhoto[]) => patchDraft(item, { photos: photos.slice(0, MAX_PHOTOS) });
  const setSopStep = (item: DeliveryCheckItem, stepId: string, patch: { done?: boolean; photo?: DraftPhoto | null }) => {
    const cur = draftOf(item).sop[stepId] ?? { done: false };
    const next = { done: patch.done ?? cur.done, photo: patch.photo === null ? undefined : (patch.photo ?? cur.photo) };
    // Unticking a step drops its photograph: the evidence belongs to the tick.
    patchDraft(item, { sop: { ...draftOf(item).sop, [stepId]: next.done ? next : { done: false } } });
  };

  /* --------------------------------- a procedure that changed under the device */
  // A device remembers the procedure it last showed. If the one now governing this part is newer, the
  // person is told, and the steps they have not seen are pointed out so nothing is ticked off blind.
  const [sopNotices, setSopNotices] = useState<Record<string, { from: number; to: number; newStepIds: string[] }>>({});
  useEffect(() => {
    if (!open || open.status !== 'in_progress') {
      setSopNotices({});
      return;
    }
    let seen: Record<string, { version: number; stepIds: string[] }> = {};
    try {
      seen = JSON.parse(window.localStorage.getItem(SOP_SEEN_KEY) ?? '{}');
    } catch {
      seen = {};
    }
    const notices: Record<string, { from: number; to: number; newStepIds: string[] }> = {};
    for (const item of open.items) {
      for (const ref of item.sopVersions ?? []) {
        const steps = (item.sopSteps ?? []).filter((st) => (st as { source?: string }).source === (ref.category === 'all' ? 'all' : 'category'));
        const known = seen[ref.templateId];
        if (known && known.version < ref.version) {
          const fresh = steps.filter((st) => !known.stepIds.includes(st.id)).map((st) => st.id);
          notices[item.lineItemId] = { from: known.version, to: ref.version, newStepIds: [...(notices[item.lineItemId]?.newStepIds ?? []), ...fresh] };
        }
        seen[ref.templateId] = { version: Math.max(ref.version, known?.version ?? 0), stepIds: [...new Set([...(known?.stepIds ?? []), ...steps.map((st) => st.id)])] };
      }
    }
    try {
      window.localStorage.setItem(SOP_SEEN_KEY, JSON.stringify(seen));
    } catch {
      // Storage blocked: the notice simply won't appear.
    }
    setSopNotices(notices);
  }, [open?.id, open?.status]);

  const firstPending = open?.items.find((i) => i.verdict === 'pending')?.lineItemId ?? null;
  // The next unchecked part opens by itself; a person can open any other.
  const expandedId = expanded === undefined ? firstPending : expanded;
  const toggleExpanded = (id: string) => setExpanded(expandedId === id ? null : id);

  const problemFor = (item: DeliveryCheckItem): ItemProblem | null => problemWith(findingsOf(draftOf(item), item), item.expectedQty);
  const kindsFor = (item: DeliveryCheckItem) => kindsOf(findingsOf(draftOf(item), item), item.expectedQty);

  const saveItem = async (item: DeliveryCheckItem): Promise<ActionResult> => {
    if (!user || !open) return { ok: false, code: 'forbidden' };
    const d = draftOf(item);
    setBusy(true);
    try {
      const qty = d.qty.trim() === '' ? undefined : Number(d.qty);
      const next = await repository.saveDeliveryCheckItem(
        open.id,
        item.lineItemId,
        {
          arrived: d.arrived,
          receivedQty: d.arrived ? qty : 0,
          conditionOk: d.conditionOk,
          specOk: d.specOk,
          note: d.note,
          photos: d.photos,
          sopResults: (item.sopSteps ?? []).map((st) => ({ stepId: st.id, done: !!d.sop[st.id]?.done, photo: d.sop[st.id]?.photo })),
        },
        user.id,
      );
      await load();
      setDrafts((cur) => {
        const { [draftKey(item)]: _saved, ...rest } = cur;
        void _saved;
        return rest;
      });
      // On to the next part that's still waiting.
      setExpanded(next.items.find((i) => i.verdict === 'pending')?.lineItemId ?? null);
      return { ok: true };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  const progress = useMemo(() => (open ? progressOf(open.items) : null), [open]);

  /* -------------------------------------------------------- sign-off */
  const [signOpen, setSignOpen] = useState(false);
  const [sign, setSign] = useState<SignOffDraft>({ role: 'technician', name: '', phone: '', ackName: '', note: '' });
  const patchSign = (patch: Partial<SignOffDraft>) => setSign((cur) => ({ ...cur, ...patch }));

  const openSignOff = () => {
    // A technician signing for themselves needs no typing; Admin names whoever stood there.
    setSign({ role: isAdmin ? 'site_contact' : 'technician', name: isAdmin ? '' : (user?.name ?? ''), phone: '', ackName: '', note: '' });
    setSignOpen(true);
  };
  const pickRole = (r: DeliveryReceiverRole) => setSign((cur) => ({ ...cur, role: r, name: r === 'technician' && !isAdmin ? (user?.name ?? '') : cur.role === r ? cur.name : '' }));
  const canSign = !!progress?.complete && sign.name.trim().length >= 2;

  const complete = async (): Promise<ActionResult> => {
    if (!user || !open || !canSign) return { ok: false, code: 'receiver_required' };
    setBusy(true);
    try {
      const done = await repository.completeDeliveryChecklist(
        open.id,
        { receiver: { role: sign.role, name: sign.name, phone: sign.phone || undefined }, siteAckName: sign.ackName || undefined, note: sign.note || undefined },
        user.id,
      );
      setSignOpen(false);
      setResult(done);
      await load();
      return { ok: true };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  const discard = async (): Promise<ActionResult> => {
    if (!user || !open) return { ok: false, code: 'forbidden' };
    setBusy(true);
    try {
      await repository.cancelDeliveryChecklist(open.id, user.id);
      await load();
      closeChecklist();
      return { ok: true };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  return {
    status,
    board,
    reload,
    busy,
    isAdmin,
    // board
    arrivals,
    recent,
    filteredToPo,
    showAll,
    start,
    openChecklist,
    closeChecklist,
    // checklist
    checklistParam,
    open,
    progress,
    expandedId,
    toggleExpanded,
    draftOf,
    patchDraft,
    setPhotos,
    setSopStep,
    sopNotices,
    problemFor,
    kindsFor,
    saveItem,
    // sign-off
    signOpen,
    setSignOpen,
    openSignOff,
    sign,
    patchSign,
    pickRole,
    canSign,
    complete,
    result,
    discard,
  };
}

export type DeliveryChecklistState = ReturnType<typeof useDeliveryChecklist>;
