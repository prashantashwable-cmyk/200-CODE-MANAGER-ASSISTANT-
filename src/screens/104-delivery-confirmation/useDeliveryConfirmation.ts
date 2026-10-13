import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DeliveryConfirmationView } from '@/data/repository';
import type { ConfirmationPartyRole } from '@/data/types';
import type { DeliveryConfirmationStatus } from './delivery-confirmation.types';
import { QUEUE_STORAGE_KEY } from './delivery-confirmation.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
  /** Signed on this device but not yet sent: the network is down. */
  queued?: boolean;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

/** A signature drawn on site while the network was down, waiting to be sent. */
interface QueuedSignature {
  confirmationId: string;
  userId: string;
  signatures: { role: ConfirmationPartyRole; name: string; signature: string }[];
  note?: string;
  /** When they were actually drawn: that is the moment that gets locked, not when the network came back. */
  capturedAt: string;
}

function readQueue(): QueuedSignature[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedSignature[]) : [];
  } catch {
    return [];
  }
}
function writeQueue(queue: QueuedSignature[]) {
  try {
    window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full or blocked: the signature stays on screen and can be retried.
  }
}

export interface SignDraft {
  signature: string;
  hasSecond: boolean;
  secondRole: 'customer' | 'site_contact';
  secondName: string;
  secondSignature: string;
  note: string;
}

const EMPTY_DRAFT: SignDraft = { signature: '', hasSecond: false, secondRole: 'customer', secondName: '', secondSignature: '', note: '' };

export function useDeliveryConfirmation() {
  const repository = useData();
  const { user, role } = useSession();
  const isAdmin = role === 'admin';
  const isCustomer = role === 'customer';
  const [searchParams, setSearchParams] = useSearchParams();
  const confirmationParam = searchParams.get('confirmation');
  const poParam = searchParams.get('poId');

  const [status, setStatus] = useState<DeliveryConfirmationStatus>('loading');
  const [items, setItems] = useState<DeliveryConfirmationView[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [queue, setQueue] = useState<QueuedSignature[]>(() => readQueue());

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setItems(await repository.getDeliveryConfirmations(user.id));
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

  /* ---------------------------------------------- connectivity + the queue */
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  const mine = useMemo(() => queue.filter((q) => q.userId === user?.id), [queue, user?.id]);
  const queuedIds = useMemo(() => new Set(mine.map((q) => q.confirmationId)), [mine]);

  // The moment the network is back, whatever waited on this device goes.
  const [flushed, setFlushed] = useState(0);
  useEffect(() => {
    if (!online || !user || mine.length === 0) return undefined;
    let live = true;
    void (async () => {
      let remaining = readQueue();
      let sent = 0;
      for (const item of mine) {
        try {
          await repository.signDeliveryConfirmation(item.confirmationId, { signatures: item.signatures, note: item.note, capturedAt: item.capturedAt }, user.id);
          sent += 1;
        } catch (e) {
          // Already signed elsewhere, or no longer ours: nothing left to send. Anything else waits.
          const code = e instanceof Error ? e.message : '';
          if (code !== 'invalid_state' && code !== 'not_found' && code !== 'forbidden') continue;
        }
        remaining = remaining.filter((q) => !(q.confirmationId === item.confirmationId && q.userId === item.userId));
      }
      writeQueue(remaining);
      if (!live) return;
      setQueue(remaining);
      if (sent > 0) {
        setFlushed((n) => n + sent);
        await load();
      }
    })();
    return () => {
      live = false;
    };
    // The queue itself only changes through this effect or a new submit; connectivity drives it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, user?.id, repository, mine.length]);

  /* ---------------------------------------------------------------- lists */
  const visible = useMemo(() => (items ?? []).filter((c) => !poParam || c.poId === poParam), [items, poParam]);
  const awaiting = useMemo(() => visible.filter((c) => c.status === 'awaiting_signature'), [visible]);
  const signed = useMemo(() => visible.filter((c) => c.status === 'signed'), [visible]);
  const filteredToPo = !!poParam;
  const showAll = () => setSearchParams({}, { replace: true });

  const open: DeliveryConfirmationView | null = useMemo(() => (items ?? []).find((c) => c.id === confirmationParam) ?? null, [items, confirmationParam]);
  const openConfirmation = (id: string) => setSearchParams({ confirmation: id });
  const closeConfirmation = () => setSearchParams(poParam ? { poId: poParam } : {}, { replace: false });

  /* ------------------------------------------------------------- signing */
  const [drafts, setDrafts] = useState<Record<string, SignDraft>>({});
  const draft: SignDraft = (open && drafts[open.id]) || EMPTY_DRAFT;
  const patch = (next: Partial<SignDraft>) => {
    if (!open) return;
    setDrafts((cur) => ({ ...cur, [open.id]: { ...(cur[open.id] ?? EMPTY_DRAFT), ...next } }));
  };

  const canSubmit =
    !!open?.canSign &&
    !!open.receiver &&
    draft.signature.length > 0 &&
    (draft.hasSecond ? draft.secondName.trim().length >= 2 && draft.secondSignature.length > 0 : draft.note.trim().length >= 4);

  const submit = async (): Promise<ActionResult> => {
    if (!user || !open || !open.receiver || !canSubmit) return { ok: false, code: 'signature_required' };
    const signatures = [
      { role: open.receiver.role as ConfirmationPartyRole, name: open.receiver.name, signature: draft.signature },
      ...(draft.hasSecond ? [{ role: draft.secondRole as ConfirmationPartyRole, name: draft.secondName.trim(), signature: draft.secondSignature }] : []),
    ];
    const capturedAt = new Date().toISOString();
    const note = draft.hasSecond ? undefined : draft.note.trim();
    // No network on site: keep the signature on this device, exactly as drawn.
    if (!online) {
      const next = [...readQueue().filter((q) => !(q.confirmationId === open.id && q.userId === user.id)), { confirmationId: open.id, userId: user.id, signatures, note, capturedAt }];
      writeQueue(next);
      setQueue(next);
      return { ok: true, queued: true };
    }
    setBusy(true);
    try {
      await repository.signDeliveryConfirmation(open.id, { signatures, note, capturedAt }, user.id);
      setDrafts((cur) => {
        const { [open.id]: _gone, ...rest } = cur;
        void _gone;
        return rest;
      });
      await load();
      return { ok: true };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  return {
    status,
    items,
    reload,
    busy,
    online,
    isAdmin,
    isCustomer,
    // lists
    awaiting,
    signed,
    filteredToPo,
    showAll,
    confirmationParam,
    open,
    openConfirmation,
    closeConfirmation,
    // signing
    draft,
    patch,
    canSubmit,
    submit,
    queuedIds,
    flushed,
  };
}

export type DeliveryConfirmationState = ReturnType<typeof useDeliveryConfirmation>;
