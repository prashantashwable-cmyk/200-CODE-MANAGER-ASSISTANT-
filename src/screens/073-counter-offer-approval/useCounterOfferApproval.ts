import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CounterOfferQueueItem } from '@/data/repository';
import type { CounterOfferApprovalStatus, DecisionSheetMode } from './counter-offer-approval.types';

interface CounterOfferApprovalState {
  status: CounterOfferApprovalStatus;
  queue: CounterOfferQueueItem[];
  companyFloorPct: number;

  deciding: string | null;
  approve: (id: string) => Promise<boolean>;

  sheetTarget: CounterOfferQueueItem | null;
  sheetMode: DecisionSheetMode | null;
  openSheet: (item: CounterOfferQueueItem, mode: DecisionSheetMode) => void;
  closeSheet: () => void;

  rejectReason: string;
  setRejectReason: (v: string) => void;
  submitReject: () => Promise<boolean>;

  counterPrice: string;
  setCounterPrice: (v: string) => void;
  submitCounter: () => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Owns the borderline counter-offer queue. Approve/Reject/Counter all route
 * through the one `decideCounterOffer` call the repository shares with the
 * Discount & Approval workflow's own decision mechanism — this hook never
 * computes a resulting price or margin itself, it only sends the decision.
 */
export function useCounterOfferApproval(): CounterOfferApprovalState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<CounterOfferApprovalStatus>('loading');
  const [queue, setQueue] = useState<CounterOfferQueueItem[]>([]);
  const [companyFloorPct, setCompanyFloorPct] = useState(0);
  const [deciding, setDeciding] = useState<string | null>(null);

  const [sheetTarget, setSheetTarget] = useState<CounterOfferQueueItem | null>(null);
  const [sheetMode, setSheetMode] = useState<DecisionSheetMode | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [counterPrice, setCounterPrice] = useState('');

  const load = useCallback(async () => {
    try {
      const [queueResult, pricing] = await Promise.all([repository.listCounterOfferQueue(), repository.getPricingConfig()]);
      setQueue(queueResult);
      setCompanyFloorPct(pricing.minimumMarginFloorPct);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = useCallback(
    async (id: string) => {
      if (!user) return false;
      setDeciding(id);
      try {
        await repository.decideCounterOffer(id, { status: 'approved', approverId: user.id });
        await load();
        return true;
      } catch {
        return false;
      } finally {
        setDeciding(null);
      }
    },
    [repository, user, load],
  );

  const openSheet = useCallback((item: CounterOfferQueueItem, mode: DecisionSheetMode) => {
    setSheetTarget(item);
    setSheetMode(mode);
    setRejectReason('');
    setCounterPrice('');
  }, []);

  const closeSheet = useCallback(() => {
    setSheetTarget(null);
    setSheetMode(null);
  }, []);

  const submitReject = useCallback(async () => {
    if (!user || !sheetTarget || !rejectReason.trim()) return false;
    setDeciding(sheetTarget.id);
    try {
      await repository.decideCounterOffer(sheetTarget.id, { status: 'rejected', approverId: user.id, rejectionReason: rejectReason.trim() });
      await load();
      closeSheet();
      return true;
    } catch {
      return false;
    } finally {
      setDeciding(null);
    }
  }, [repository, user, sheetTarget, rejectReason, load, closeSheet]);

  const submitCounter = useCallback(async () => {
    const price = Number(counterPrice);
    if (!user || !sheetTarget || !counterPrice || price <= 0) return false;
    setDeciding(sheetTarget.id);
    try {
      await repository.decideCounterOffer(sheetTarget.id, { status: 'countered', approverId: user.id, counterPriceOffered: price });
      await load();
      closeSheet();
      return true;
    } catch {
      return false;
    } finally {
      setDeciding(null);
    }
  }, [repository, user, sheetTarget, counterPrice, load, closeSheet]);

  return {
    status,
    queue,
    companyFloorPct,
    deciding,
    approve,
    sheetTarget,
    sheetMode,
    openSheet,
    closeSheet,
    rejectReason,
    setRejectReason,
    submitReject,
    counterPrice,
    setCounterPrice,
    submitCounter,
    reload: load,
  };
}
