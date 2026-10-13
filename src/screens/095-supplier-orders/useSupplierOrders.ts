import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SupplierOrderCard } from '@/data/repository';
import type { PoFulfilmentStage } from '@/data/types';
import { FULFILMENT_STAGES, SUPPLIER_SETTABLE_STAGES, stageIndex } from '@/features/suppliers/fulfilment';
import { MULTI_COLUMN_MIN_WIDTH } from './supplier-orders.types';
import type { SupplierOrdersStatus } from './supplier-orders.types';

function useWideViewport(): boolean {
  const query = `(min-width: ${MULTI_COLUMN_MIN_WIDTH}px)`;
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setWide(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);
  return wide;
}

export function useSupplierOrders() {
  const repository = useData();
  const { user, role } = useSession();
  const isAdmin = role === 'admin';
  const [searchParams] = useSearchParams();
  const wide = useWideViewport();

  const [status, setStatus] = useState<SupplierOrdersStatus>('loading');
  const [cards, setCards] = useState<SupplierOrderCard[]>([]);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [stageCursor, setStageCursor] = useState(1);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setCards(await repository.listSupplierOrderBoard(user.id));
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      cards.filter(
        (c) => (!supplierFilter || c.po.supplierId === supplierFilter) && (!atRiskOnly || c.delay.risk !== 'on_track'),
      ),
    [cards, supplierFilter, atRiskOnly],
  );

  const columns = useMemo(
    () =>
      FULFILMENT_STAGES.map((stage) => {
        const inStage = visible.filter((c) => c.stage === stage);
        return { stage, cards: inStage, total: inStage.reduce((sum, c) => sum + c.totalValue, 0) };
      }),
    [visible],
  );

  // On a phone, open on the first stage that actually has orders rather
  // than an empty column (a deep-linked PO overrides this below).
  const cursorPlaced = useRef(false);
  useEffect(() => {
    if (cursorPlaced.current || status !== 'ready' || searchParams.get('poId')) return;
    cursorPlaced.current = true;
    const first = columns.findIndex((c) => c.cards.length > 0);
    if (first >= 0) setStageCursor(first);
  }, [status, columns, searchParams]);

  const supplierOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of cards) if (c.po.supplierId) seen.set(c.po.supplierId, c.supplierName);
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [cards]);

  /* ------------------------------------------------------------ detail sheet */
  const [openPoId, setOpenPoId] = useState<string | null>(searchParams.get('poId'));
  const openCard = cards.find((c) => c.po.id === openPoId) ?? null;
  /** Per-line target stage while editing; absent means "leave as is". */
  const [lineTargets, setLineTargets] = useState<Record<string, PoFulfilmentStage>>({});
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Deep link (?poId=) — jump the mobile tab strip to that PO's stage too.
  useEffect(() => {
    if (openCard) setStageCursor(stageIndex(openCard.stage));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCard?.po.id]);

  const open = (poId: string, presetStage?: PoFulfilmentStage) => {
    setOpenPoId(poId);
    setNote('');
    const card = cards.find((c) => c.po.id === poId);
    setLineTargets(presetStage && card ? Object.fromEntries(card.lines.map((l) => [l.line.id, presetStage])) : {});
  };
  const close = () => setOpenPoId(null);

  const allowedStages: PoFulfilmentStage[] = isAdmin ? FULFILMENT_STAGES : SUPPLIER_SETTABLE_STAGES;

  const setLineTarget = (lineId: string, stage: PoFulfilmentStage | '') =>
    setLineTargets((current) => {
      const next = { ...current };
      if (stage) next[lineId] = stage;
      else delete next[lineId];
      return next;
    });
  const setAllTargets = (stage: PoFulfilmentStage | '') =>
    setLineTargets(stage && openCard ? Object.fromEntries(openCard.lines.map((l) => [l.line.id, stage])) : {});

  /** Only the lines that would actually change. */
  const changes = useMemo(
    () =>
      openCard
        ? openCard.lines
            .filter((l) => lineTargets[l.line.id] && lineTargets[l.line.id] !== l.stage)
            .map((l) => ({ lineId: l.line.id, from: l.stage, to: lineTargets[l.line.id] }))
        : [],
    [openCard, lineTargets],
  );
  const backward = changes.some((c) => stageIndex(c.to) < stageIndex(c.from));
  const onBehalf = isAdmin && changes.some((c) => c.to !== 'delivered');
  const noteNeeded = backward || onBehalf;
  const canSave = changes.length > 0 && (!noteNeeded || note.trim().length >= 4) && !saving;

  /** One repository call per target stage — each is its own honest event. */
  const save = async (): Promise<boolean> => {
    if (!user || !openCard || !canSave) return false;
    setSaving(true);
    try {
      const byTarget = new Map<PoFulfilmentStage, string[]>();
      for (const c of changes) byTarget.set(c.to, [...(byTarget.get(c.to) ?? []), c.lineId]);
      for (const [toStage, lineIds] of byTarget) {
        await repository.updatePurchaseOrderFulfilment(openCard.po.id, { lineIds, toStage, note: note.trim() || undefined }, user.id);
      }
      setLineTargets({});
      setNote('');
      await load();
      return true;
    } catch {
      await load();
      return false;
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------- drag and drop */
  const [dragPoId, setDragPoId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<PoFulfilmentStage | null>(null);

  /**
   * A drop moves every line to that stage. A plain forward move by the
   * supplier saves at once; anything needing a note (backward, or Admin on a
   * supplier's behalf) opens the sheet pre-filled instead of saving blind.
   */
  const dropOn = async (stage: PoFulfilmentStage): Promise<boolean | 'needs_note' | null> => {
    const card = cards.find((c) => c.po.id === dragPoId);
    setDragPoId(null);
    setDropStage(null);
    if (!user || !card || !allowedStages.includes(stage)) return null;
    const moving = card.lines.filter((l) => l.stage !== stage);
    if (moving.length === 0) return null;
    const isBackward = moving.some((l) => stageIndex(l.stage) > stageIndex(stage));
    if (isBackward || (isAdmin && stage !== 'delivered') || (!isAdmin && moving.some((l) => l.stage === 'delivered'))) {
      open(card.po.id, stage);
      return 'needs_note';
    }
    try {
      await repository.updatePurchaseOrderFulfilment(card.po.id, { lineIds: 'all', toStage: stage }, user.id);
      await load();
      return true;
    } catch {
      return false;
    }
  };

  return {
    status,
    isAdmin,
    wide,
    reload: load,
    cards,
    visible,
    columns,
    supplierOptions,
    supplierFilter,
    setSupplierFilter,
    atRiskOnly,
    setAtRiskOnly,
    stageCursor,
    setStageCursor,
    openCard,
    open,
    close,
    allowedStages,
    lineTargets,
    setLineTarget,
    setAllTargets,
    note,
    setNote,
    changes,
    backward,
    onBehalf,
    noteNeeded,
    canSave,
    saving,
    save,
    dragPoId,
    setDragPoId,
    dropStage,
    setDropStage,
    dropOn,
  };
}

export type SupplierOrdersState = ReturnType<typeof useSupplierOrders>;
