import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ScoredOrderRating, SupplierScorecard } from '@/data/repository';
import type { DefectAttribution, Supplier } from '@/data/types';
import { orderQuality, orderScore } from '@/features/suppliers/orderRating';
import { TREND_POINTS } from './supplier-scorecard.types';
import type { ScorecardTab, SupplierScorecardStatus } from './supplier-scorecard.types';

export function useSupplierScorecard() {
  const repository = useData();
  const { user, role } = useSession();
  const isAdmin = role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSupplierId = searchParams.get('supplierId');

  const [status, setStatus] = useState<SupplierScorecardStatus>('loading');
  const [card, setCard] = useState<SupplierScorecard | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tab, setTab] = useState<ScorecardTab>(searchParams.get('rating') ? 'orders' : 'breakdown');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      let supplierId = requestedSupplierId;
      if (!isAdmin) {
        supplierId = (await repository.getSupplierForUser(user.id))?.id ?? null;
      } else if (!supplierId) {
        setSuppliers(await repository.listSuppliers());
        setStatus('pick');
        return;
      }
      if (!supplierId) {
        setStatus('not_found');
        return;
      }
      const next = await repository.getSupplierScorecard(supplierId, user.id);
      setCard(next);
      setStatus(next ? 'ready' : 'not_found');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, isAdmin, requestedSupplierId]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickSupplier = (supplierId: string) => setSearchParams({ supplierId });

  /** Oldest → newest, the last few orders, each through the one engine. */
  const trend = useMemo(
    () =>
      card
        ? [...card.ratings]
            .slice(0, TREND_POINTS)
            .reverse()
            .map((r) => ({ code: r.rating.orderCode, date: r.rating.deliveredAt, score: Math.round(r.orderScore * 1000) / 1000 }))
        : [],
    [card],
  );
  const disputed = useMemo(() => card?.ratings.filter((r) => r.rating.dispute) ?? [], [card]);
  const openDisputes = disputed.filter((r) => r.rating.dispute?.status === 'open').length;

  /* ------------------------------------------------------- rating sheet */
  const [openRatingId, setOpenRatingId] = useState<string | null>(searchParams.get('rating'));
  const openRating: ScoredOrderRating | null = card?.ratings.find((r) => r.rating.id === openRatingId) ?? null;
  const [busy, setBusy] = useState(false);

  const [disputeReason, setDisputeReason] = useState('');
  const [defectNote, setDefectNote] = useState('');
  const [defectAttribution, setDefectAttribution] = useState<DefectAttribution>('supplier');
  const [qualityValue, setQualityValue] = useState<string>('');
  const [qualityNote, setQualityNote] = useState('');
  const [resolveOutcome, setResolveOutcome] = useState<'upheld' | 'rejected'>('upheld');
  const [resolveNote, setResolveNote] = useState('');
  const [reattribute, setReattribute] = useState<Record<string, DefectAttribution>>({});

  const openSheet = (ratingId: string) => {
    setOpenRatingId(ratingId);
    setDisputeReason('');
    setDefectNote('');
    setDefectAttribution('supplier');
    const r = card?.ratings.find((x) => x.rating.id === ratingId);
    setQualityValue(r?.rating.adminQuality ? String(r.rating.adminQuality) : '');
    setQualityNote('');
    setResolveOutcome('upheld');
    setResolveNote('');
    setReattribute({});
  };
  const closeSheet = () => setOpenRatingId(null);

  const run = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    try {
      await fn();
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  const raiseDispute = () =>
    openRating && user ? run(() => repository.raiseRatingDispute(openRating.rating.id, disputeReason, user.id)) : Promise.resolve(false);
  const logDefect = async () => {
    if (!openRating || !user) return false;
    const ok = await run(() => repository.logOrderDefect(openRating.rating.id, defectNote, defectAttribution, user.id));
    if (ok) setDefectNote('');
    return ok;
  };
  const saveQuality = () =>
    openRating && user
      ? run(() => repository.setOrderAdminQuality(openRating.rating.id, qualityValue ? Number(qualityValue) : null, qualityNote, user.id))
      : Promise.resolve(false);

  /** What upholding with these reattributions would do to this order — shown
   *  before Admin decides, so the effect on the supplier is never a surprise. */
  const resolvePreview = useMemo(() => {
    if (!openRating || !card) return null;
    // The same engine as everything else, applied to the would-be rating.
    const wouldBe = { ...openRating.rating, defects: openRating.rating.defects.map((d) => ({ ...d, attribution: reattribute[d.id] ?? d.attribution })) };
    return { quality: orderQuality(wouldBe), score: orderScore(wouldBe, card.supplier) };
  }, [openRating, card, reattribute]);

  const resolveDispute = () =>
    openRating && user
      ? run(() =>
          repository.resolveRatingDispute(
            openRating.rating.id,
            {
              outcome: resolveOutcome,
              note: resolveNote,
              reattribute: resolveOutcome === 'upheld' ? Object.entries(reattribute).map(([defectId, to]) => ({ defectId, to })) : undefined,
            },
            user.id,
          ),
        )
      : Promise.resolve(false);

  /* ------------------------------------------------------ context notes */
  const [noteOpen, setNoteOpen] = useState(false);
  const [contextNote, setContextNote] = useState('');
  const addContextNote = async () => {
    if (!card || !user) return false;
    const ok = await run(() => repository.addScoreContextNote(card.supplier.id, contextNote, user.id));
    if (ok) {
      setContextNote('');
      setNoteOpen(false);
    }
    return ok;
  };

  return {
    status,
    isAdmin,
    card,
    suppliers,
    pickSupplier,
    reload: load,
    tab,
    setTab,
    trend,
    disputed,
    openDisputes,
    openRating,
    openSheet,
    closeSheet,
    busy,
    disputeReason,
    setDisputeReason,
    raiseDispute,
    defectNote,
    setDefectNote,
    defectAttribution,
    setDefectAttribution,
    logDefect,
    qualityValue,
    setQualityValue,
    qualityNote,
    setQualityNote,
    saveQuality,
    resolveOutcome,
    setResolveOutcome,
    resolveNote,
    setResolveNote,
    reattribute,
    setReattribute,
    resolvePreview,
    resolveDispute,
    noteOpen,
    setNoteOpen,
    contextNote,
    setContextNote,
    addContextNote,
  };
}

export type SupplierScorecardState = ReturnType<typeof useSupplierScorecard>;
