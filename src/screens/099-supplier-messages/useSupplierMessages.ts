import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SupplierMessageSearchHit, SupplierThreadSummary, SupplierThreadView } from '@/data/repository';
import type { Supplier, SupplierMessageAuthor, SupplierMessageChannel } from '@/data/types';
import type { DocumentSlotValue } from '@/features/onboarding/DocumentSlot';
import type { SupplierMessagesStatus } from './supplier-messages.types';

/** Local yyyy-mm-ddThh:mm, for a datetime-local input. */
function nowForInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type SendResult = 'ok' | 'no_portal' | 'error';

export function useSupplierMessages() {
  const repository = useData();
  const { user, role } = useSession();
  const isAdmin = role === 'admin';
  const viewerSide: SupplierMessageAuthor = isAdmin ? 'aiec' : 'supplier';
  const [searchParams, setSearchParams] = useSearchParams();
  const threadParam = searchParams.get('thread');
  const supplierParam = searchParams.get('supplierId');
  const poParam = searchParams.get('poId') ?? undefined;
  const isOpen = !!threadParam || !!supplierParam;

  const [status, setStatus] = useState<SupplierMessagesStatus>('loading');
  const [threads, setThreads] = useState<SupplierThreadSummary[]>([]);
  const [view, setView] = useState<SupplierThreadView | null>(null);
  const [threadStatus, setThreadStatus] = useState<'idle' | 'loading' | 'ready' | 'not_found' | 'error'>('idle');
  const [ownSupplier, setOwnSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const loadList = useCallback(async () => {
    if (!user) return;
    try {
      setThreads(await repository.listSupplierThreads(user.id));
      if (isAdmin) setSuppliers(await repository.listSuppliers());
      else setOwnSupplier(await repository.getSupplierForUser(user.id));
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, isAdmin]);

  const loadThread = useCallback(async () => {
    if (!user || !isOpen) {
      setView(null);
      setThreadStatus('idle');
      return;
    }
    setThreadStatus((current) => (current === 'ready' ? 'ready' : 'loading'));
    try {
      let supplierId = supplierParam;
      if (!threadParam && !isAdmin) supplierId = (await repository.getSupplierForUser(user.id))?.id ?? null;
      const ref = threadParam ? { threadId: threadParam } : supplierId ? { supplierId, poId: poParam } : null;
      const next = ref ? await repository.getSupplierThread(ref, user.id) : null;
      setView(next);
      setThreadStatus(next ? 'ready' : 'not_found');
      // Opening it is reading it — the other side's read receipt.
      if (next?.threadId && next.messages.some((m) => m.author !== viewerSide && !m.readAt)) {
        await repository.markSupplierThreadRead(next.threadId, user.id);
        setThreads(await repository.listSupplierThreads(user.id));
      }
    } catch {
      setThreadStatus('error');
    }
  }, [repository, user, isAdmin, isOpen, threadParam, supplierParam, poParam, viewerSide]);

  useEffect(() => {
    void loadList();
  }, [loadList]);
  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  const openThread = (threadId: string) => setSearchParams({ thread: threadId });
  const openFor = (supplierId: string, poId?: string) => setSearchParams(poId ? { supplierId, poId } : { supplierId });
  const closeThread = () => setSearchParams({});

  /* ------------------------------------------------------------- search */
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SupplierMessageSearchHit[] | null>(null);
  useEffect(() => {
    if (!user || query.trim().length < 2) {
      setHits(null);
      return undefined;
    }
    let live = true;
    const timer = window.setTimeout(() => {
      void repository.searchSupplierMessages(query, user.id).then((r) => live && setHits(r));
    }, 200);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [repository, user, query]);

  /* ----------------------------------------------------------- composer */
  const [draft, setDraft] = useState('');
  const [expectsReply, setExpectsReply] = useState(true);
  const [attachOpen, setAttachOpen] = useState(false);
  const [poRef, setPoRef] = useState<string>('');
  const [document, setDocument] = useState<DocumentSlotValue | null>(null);
  const [sending, setSending] = useState(false);

  // A new conversation starts clean; a PO thread offers its own order to attach.
  useEffect(() => {
    setDraft('');
    setExpectsReply(true);
    setPoRef('');
    setDocument(null);
  }, [threadParam, supplierParam, poParam]);

  const refresh = async (threadId: string | null) => {
    if (threadId && threadId !== threadParam) setSearchParams({ thread: threadId });
    else await loadThread();
    if (user) setThreads(await repository.listSupplierThreads(user.id));
  };

  const send = async (): Promise<SendResult> => {
    if (!view || !user || !draft.trim()) return 'error';
    setSending(true);
    try {
      const msg = await repository.postSupplierMessage(
        {
          supplierId: view.supplier.id,
          poId: view.po?.id,
          body: draft,
          expectsReply,
          poRef: poRef || undefined,
          attachmentName: document?.fileName,
        },
        user.id,
      );
      setDraft('');
      setPoRef('');
      setDocument(null);
      setExpectsReply(true);
      await refresh(msg.threadId);
      return 'ok';
    } catch (e) {
      return e instanceof Error && e.message === 'no_portal' ? 'no_portal' : 'error';
    } finally {
      setSending(false);
    }
  };

  /* ------------------------------------------------ log external contact */
  const [logOpen, setLogOpen] = useState(false);
  const [logAuthor, setLogAuthor] = useState<SupplierMessageAuthor>('supplier');
  const [logChannel, setLogChannel] = useState<Exclude<SupplierMessageChannel, 'in_app'>>('phone');
  const [logAt, setLogAt] = useState(nowForInput());
  const [logBody, setLogBody] = useState('');
  const [logExpectsReply, setLogExpectsReply] = useState(false);
  const logInFuture = !!logAt && new Date(logAt).getTime() > Date.now() + 60_000;
  const openLog = () => {
    setLogAuthor('supplier');
    setLogChannel('phone');
    setLogAt(nowForInput());
    setLogBody('');
    setLogExpectsReply(false);
    setLogOpen(true);
  };
  const saveLog = async (): Promise<boolean> => {
    if (!view || !user) return false;
    setSending(true);
    try {
      const msg = await repository.logSupplierContact(
        {
          supplierId: view.supplier.id,
          poId: view.po?.id,
          author: logAuthor,
          channel: logChannel,
          at: new Date(logAt).toISOString(),
          body: logBody,
          expectsReply: logExpectsReply,
          poRef: view.po?.id,
        },
        user.id,
      );
      setLogOpen(false);
      await refresh(msg.threadId);
      return true;
    } catch {
      return false;
    } finally {
      setSending(false);
    }
  };

  /* ------------------------------------------------ flag to formal record */
  const [flagMessageId, setFlagMessageId] = useState<string | null>(null);
  const [flagNote, setFlagNote] = useState('');
  const flagMessage = useMemo(() => view?.messages.find((m) => m.id === flagMessageId) ?? null, [view, flagMessageId]);
  const openFlag = (messageId: string) => {
    setFlagMessageId(messageId);
    setFlagNote('');
  };
  const saveFlag = async (): Promise<boolean> => {
    if (!flagMessageId || !user) return false;
    setSending(true);
    try {
      await repository.flagSupplierMessageToRecord(flagMessageId, flagNote, user.id);
      setFlagMessageId(null);
      await loadThread();
      return true;
    } catch {
      return false;
    } finally {
      setSending(false);
    }
  };

  /* ---------------------------------------------------- new conversation */
  const [startOpen, setStartOpen] = useState(false);
  const [startSupplierId, setStartSupplierId] = useState('');
  const [startPoId, setStartPoId] = useState('');
  const [startPoOptions, setStartPoOptions] = useState<{ id: string; code: string }[]>([]);
  const startSupplier = isAdmin ? startSupplierId : (ownSupplier?.id ?? '');
  useEffect(() => {
    if (!startOpen || !startSupplier || !user) {
      setStartPoOptions([]);
      return;
    }
    void repository.getSupplierThread({ supplierId: startSupplier }, user.id).then((v) => setStartPoOptions(v?.poOptions ?? []));
  }, [repository, user, startOpen, startSupplier]);
  const openStart = () => {
    setStartSupplierId('');
    setStartPoId('');
    setStartOpen(true);
  };
  const confirmStart = () => {
    if (!startSupplier) return;
    setStartOpen(false);
    // An existing conversation on the same topic is reopened, never duplicated.
    const existing = threads.find((th) => th.supplierId === startSupplier && (th.poId ?? '') === startPoId);
    if (existing) openThread(existing.threadId);
    else openFor(startSupplier, startPoId || undefined);
  };

  return {
    status,
    isAdmin,
    viewerSide,
    threads,
    reloadList: loadList,
    isOpen,
    view,
    threadStatus,
    reloadThread: loadThread,
    activeThreadId: view?.threadId ?? threadParam,
    openThread,
    closeThread,
    query,
    setQuery,
    hits,
    draft,
    setDraft,
    expectsReply,
    setExpectsReply,
    attachOpen,
    setAttachOpen,
    poRef,
    setPoRef,
    document,
    setDocument,
    sending,
    send,
    logOpen,
    setLogOpen,
    openLog,
    logAuthor,
    setLogAuthor,
    logChannel,
    setLogChannel,
    logAt,
    setLogAt,
    logBody,
    setLogBody,
    logExpectsReply,
    setLogExpectsReply,
    logInFuture,
    saveLog,
    flagMessage,
    openFlag,
    closeFlag: () => setFlagMessageId(null),
    flagNote,
    setFlagNote,
    saveFlag,
    startOpen,
    setStartOpen,
    openStart,
    suppliers,
    startSupplierId,
    setStartSupplierId,
    startPoId,
    setStartPoId,
    startPoOptions,
    startSupplier,
    confirmStart,
  };
}

export type SupplierMessagesState = ReturnType<typeof useSupplierMessages>;
