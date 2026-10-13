import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SupplierInvoiceBoard, SupplierInvoiceView, SubmittablePo } from '@/data/repository';
import type { DocumentSlotValue } from '@/features/onboarding/DocumentSlot';
import { matchLine } from '@/features/suppliers/invoiceMatch';
import type { LineMatch } from '@/features/suppliers/invoiceMatch';
import type { InvoiceFilter, InvoiceMatchingStatus } from './supplier-invoice-matching.types';
import { POLL_MS } from './supplier-invoice-matching.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
  invoice?: SupplierInvoiceView;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export type SupplierInvoiceMatchingState = ReturnType<typeof useSupplierInvoiceMatching>;

/** A row of the submit form: an order line to bill (some or all of it), or an item not on the order. */
export interface FormLine {
  key: string;
  lineItemId: string | null;
  description: string;
  include: boolean;
  quantity: string;
  unitPrice: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export function useSupplierInvoiceMatching() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const invoiceParam = searchParams.get('invoice');
  const poParam = searchParams.get('po');

  const [status, setStatus] = useState<InvoiceMatchingStatus>('loading');
  const [board, setBoard] = useState<SupplierInvoiceBoard | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBoard(await repository.getSupplierInvoiceBoard(user.id));
      setStatus('ready');
    } catch {
      // A failed refresh never blanks a board that is already showing.
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);
  const reload = () => {
    setStatus('loading');
    void load();
  };

  const isAdmin = board?.viewer !== 'supplier';

  /* ------------------------------------------------------------- filters */
  const [filter, setFilter] = useState<InvoiceFilter>('attention');
  const [query, setQuery] = useState('');
  const invoices = useMemo(() => (board?.invoices ?? []).filter((i) => !poParam || i.poId === poParam), [board, poParam]);
  const waiting = useMemo(() => (board?.waiting ?? []).filter((w) => !poParam || w.poId === poParam), [board, poParam]);
  const buckets = useMemo(
    () => ({
      attention: invoices.filter((i) => i.status === 'mismatch' || i.status === 'awaiting_delivery'),
      missing: [] as SupplierInvoiceView[],
      matched: invoices.filter((i) => i.status === 'matched'),
      rejected: invoices.filter((i) => i.status === 'rejected'),
    }),
    [invoices],
  );
  const counts: Record<InvoiceFilter, number> = { attention: buckets.attention.length, missing: waiting.length, matched: buckets.matched.length, rejected: buckets.rejected.length };
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return buckets[filter].filter((i) => !q || [i.supplierName, i.poCode, i.siteName, i.invoiceNumber, i.code].some((v) => v.toLowerCase().includes(q)));
  }, [buckets, filter, query]);
  const shownWaiting = useMemo(() => {
    const q = query.trim().toLowerCase();
    return waiting.filter((w) => !q || [w.supplierName, w.poCode, w.siteName].some((v) => v.toLowerCase().includes(q)));
  }, [waiting, query]);
  const clearPo = () => setSearchParams({}, { replace: true });
  // Arriving for one order (from a payment, a commitment), the list opens on whatever that order actually has.
  const landedOn = useMemo(() => `${poParam ?? ''}`, [poParam]);
  const [placedFor, setPlacedFor] = useState('');
  useEffect(() => {
    if (status !== 'ready' || !poParam || placedFor === landedOn) return;
    setPlacedFor(landedOn);
    const first = (['attention', 'missing', 'matched', 'rejected'] as InvoiceFilter[]).find((f) => (f === 'missing' ? waiting.length : buckets[f].length) > 0);
    if (first) setFilter(first);
  }, [status, poParam, placedFor, landedOn, waiting, buckets]);

  /* -------------------------------------------------------------- detail */
  const current = useMemo(() => (board?.invoices ?? []).find((i) => i.id === invoiceParam) ?? null, [board, invoiceParam]);
  const openInvoice = (id: string) => setSearchParams({ invoice: id });
  const closeInvoice = () => setSearchParams(poParam ? { po: poParam } : {}, { replace: true });

  const run = async (fn: () => Promise<ActionResult | void>): Promise<ActionResult> => {
    setBusy(true);
    try {
      const out = (await fn()) ?? { ok: true };
      await load();
      return out;
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* --------------------------------------------------------------- submit */
  const [formOpen, setFormOpen] = useState(false);
  const [formPoId, setFormPoId] = useState('');
  const [number, setNumber] = useState('');
  const [date, setDate] = useState(today);
  const [doc, setDoc] = useState<DocumentSlotValue | null>(null);
  const [lines, setLines] = useState<FormLine[]>([]);
  const submittable = board?.submittable ?? [];
  const formPo: SubmittablePo | undefined = submittable.find((p) => p.poId === formPoId);

  const linesFor = (po: SubmittablePo | undefined): FormLine[] =>
    (po?.lines ?? []).map((l) => {
      const remaining = Math.max(0, l.orderedQty - l.billedQty);
      return { key: l.id, lineItemId: l.id, description: l.description, include: remaining > 0 && l.deliveredQty > l.billedQty, quantity: String(remaining), unitPrice: String(l.orderPrice) };
    });
  const openForm = (poId?: string) => {
    const first = poId ?? poParam ?? submittable[0]?.poId ?? '';
    setFormPoId(first);
    setLines(linesFor(submittable.find((p) => p.poId === first)));
    setNumber('');
    setDate(today());
    setDoc(null);
    setFormOpen(true);
  };
  const pickOrder = (poId: string) => {
    setFormPoId(poId);
    setLines(linesFor(submittable.find((p) => p.poId === poId)));
  };
  const patchLine = (key: string, patch: Partial<FormLine>) => setLines((cur) => cur.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const addExtra = () => setLines((cur) => [...cur, { key: `extra-${Date.now()}-${cur.length}`, lineItemId: null, description: '', include: true, quantity: '1', unitPrice: '' }]);
  const removeExtra = (key: string) => setLines((cur) => cur.filter((l) => l.key !== key));

  const chosenLines = lines.filter((l) => l.include);
  const formTotal = chosenLines.reduce((n, l) => n + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  /** What the match would say if it were submitted as typed: shown before anything is sent, from the same rules. */
  const preview: { line: FormLine; match: LineMatch }[] = useMemo(
    () =>
      chosenLines.map((line) => {
        const po = formPo?.lines.find((l) => l.id === line.lineItemId);
        const match = matchLine({
          order: po ? { quantity: po.orderedQty, price: po.orderPrice } : null,
          delivered: po?.deliveredQty ?? 0,
          billedElsewhere: po?.billedQty ?? 0,
          invoiced: { quantity: Number(line.quantity) || 0, unitPrice: Number(line.unitPrice) || 0 },
        });
        return { line, match };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines, formPo],
  );
  const formValid =
    !!formPo &&
    number.trim().length >= 2 &&
    chosenLines.length > 0 &&
    chosenLines.every((l) => Number(l.quantity) > 0 && Number(l.unitPrice) > 0 && l.description.trim().length >= 2);

  const submit = () =>
    run(async () => {
      if (!user || !formPo) return { ok: false, code: 'forbidden' };
      const invoice = await repository.submitSupplierInvoice(
        {
          poId: formPo.poId,
          invoiceNumber: number,
          invoiceDate: date,
          documentName: doc?.fileName,
          lines: chosenLines.map((l) => ({ lineItemId: l.lineItemId, description: l.description, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) })),
        },
        user.id,
      );
      setFormOpen(false);
      return { ok: true, invoice };
    });

  /* -------------------------------------------------------------- adjust */
  const [adjustFor, setAdjustFor] = useState<{ invoice: SupplierInvoiceView; lineIndex: number; changeId: string } | null>(null);
  const [adjustNote, setAdjustNote] = useState('');
  const openAdjust = (invoice: SupplierInvoiceView, lineIndex: number, changeId: string) => {
    setAdjustNote('');
    setAdjustFor({ invoice, lineIndex, changeId });
  };
  const confirmAdjust = () =>
    run(async () => {
      if (!user || !adjustFor) return { ok: false, code: 'forbidden' };
      const invoice = await repository.acceptInvoiceAdjustment(adjustFor.invoice.id, { lineIndex: adjustFor.lineIndex, changeId: adjustFor.changeId, note: adjustNote }, user.id);
      setAdjustFor(null);
      return { ok: true, invoice };
    });

  /* -------------------------------------------------------------- reject */
  const [rejectFor, setRejectFor] = useState<SupplierInvoiceView | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const openReject = (inv: SupplierInvoiceView) => {
    setRejectReason('');
    setRejectFor(inv);
  };
  const confirmReject = () =>
    run(async () => {
      if (!user || !rejectFor) return { ok: false, code: 'forbidden' };
      const invoice = await repository.rejectSupplierInvoice(rejectFor.id, rejectReason, user.id);
      setRejectFor(null);
      return { ok: true, invoice };
    });

  return {
    status,
    reload,
    busy,
    board,
    isAdmin,
    filter,
    setFilter,
    query,
    setQuery,
    poParam,
    clearPo,
    counts,
    shown,
    shownWaiting,
    current,
    invoiceParam,
    openInvoice,
    closeInvoice,
    formOpen,
    setFormOpen,
    openForm,
    submittable,
    formPoId,
    formPo,
    pickOrder,
    number,
    setNumber,
    date,
    setDate,
    doc,
    setDoc,
    lines,
    patchLine,
    addExtra,
    removeExtra,
    chosenLines,
    formTotal,
    preview,
    formValid,
    submit,
    adjustFor,
    setAdjustFor,
    adjustNote,
    setAdjustNote,
    openAdjust,
    confirmAdjust,
    rejectFor,
    setRejectFor,
    rejectReason,
    setRejectReason,
    openReject,
    confirmReject,
  };
}
