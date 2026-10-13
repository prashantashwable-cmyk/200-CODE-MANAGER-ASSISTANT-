import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { PurchaseOrderDealView } from '@/data/repository';
import type { PurchaseOrderGeneratorStatus } from './purchase-order-generator.types';

interface LineDraft {
  quantity: string;
  agreedUnitPrice: string;
}

interface PurchaseOrderGeneratorState {
  status: PurchaseOrderGeneratorStatus;
  view: PurchaseOrderDealView | null;

  lineDrafts: Record<string, LineDraft>;
  setLineDraft: (lineItemId: string, field: keyof LineDraft, value: string) => void;
  commitLine: (poId: string, lineItemId: string) => Promise<void>;

  deliveryDrafts: Record<string, string>;
  setDeliveryDraft: (poId: string, value: string) => void;
  commitDelivery: (poId: string) => Promise<void>;

  reassignOpenPoId: string | null;
  openReassign: (poId: string) => void;
  closeReassign: () => void;
  reassignSupplierId: string;
  setReassignSupplierId: (id: string) => void;
  submittingReassign: boolean;
  submitReassign: () => Promise<boolean>;

  approvingPoId: string | null;
  approvePricing: (poId: string) => Promise<boolean>;

  sendingPoId: string | null;
  sendPO: (poId: string) => Promise<boolean>;

  /** Admin's override when 094's trigger is still holding this deal. */
  draftingNow: boolean;
  draftNow: () => Promise<boolean>;

  reload: () => Promise<void>;
}

export function usePurchaseOrderGenerator(): PurchaseOrderGeneratorState {
  const { dealId } = useParams<{ dealId: string }>();
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<PurchaseOrderGeneratorStatus>('loading');
  const [view, setView] = useState<PurchaseOrderDealView | null>(null);

  const [lineDrafts, setLineDrafts] = useState<Record<string, LineDraft>>({});
  const [deliveryDrafts, setDeliveryDrafts] = useState<Record<string, string>>({});

  const [reassignOpenPoId, setReassignOpenPoId] = useState<string | null>(null);
  const [reassignSupplierId, setReassignSupplierId] = useState('');
  const [submittingReassign, setSubmittingReassign] = useState(false);

  const [approvingPoId, setApprovingPoId] = useState<string | null>(null);
  const [sendingPoId, setSendingPoId] = useState<string | null>(null);
  const [draftingNow, setDraftingNow] = useState(false);

  const load = useCallback(async () => {
    if (!dealId) {
      setStatus('error');
      return;
    }
    try {
      const result = await repository.getPurchaseOrdersForDeal(dealId);
      setView(result);
      setStatus('ready');
      const nextLineDrafts: Record<string, LineDraft> = {};
      const nextDeliveryDrafts: Record<string, string> = {};
      for (const poView of result?.purchaseOrders ?? []) {
        nextDeliveryDrafts[poView.po.id] = poView.po.expectedDeliveryDate ?? '';
        for (const line of poView.lines) {
          nextLineDrafts[line.id] = { quantity: String(line.quantity), agreedUnitPrice: String(line.agreedUnitPrice) };
        }
      }
      setLineDrafts(nextLineDrafts);
      setDeliveryDrafts(nextDeliveryDrafts);
    } catch {
      setStatus((cur) => (cur === 'ready' ? cur : 'error'));
    }
  }, [repository, dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setLineDraft = useCallback((lineItemId: string, field: keyof LineDraft, value: string) => {
    setLineDrafts((cur) => ({ ...cur, [lineItemId]: { ...cur[lineItemId], [field]: value } }));
  }, []);

  const commitLine = useCallback(
    async (poId: string, lineItemId: string) => {
      const draft = lineDrafts[lineItemId];
      if (!draft) return;
      const quantity = Number(draft.quantity);
      const agreedUnitPrice = Number(draft.agreedUnitPrice);
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(agreedUnitPrice) || agreedUnitPrice < 0) return;
      try {
        await repository.updatePurchaseOrderLine(poId, lineItemId, { quantity, agreedUnitPrice });
        await load();
      } catch {
        // Reload restores the last known-good values into the draft.
        await load();
      }
    },
    [repository, lineDrafts, load],
  );

  const setDeliveryDraft = useCallback((poId: string, value: string) => {
    setDeliveryDrafts((cur) => ({ ...cur, [poId]: value }));
  }, []);

  const commitDelivery = useCallback(
    async (poId: string) => {
      const value = deliveryDrafts[poId];
      if (!value) return;
      try {
        await repository.setPurchaseOrderExpectedDelivery(poId, value);
        await load();
      } catch {
        await load();
      }
    },
    [repository, deliveryDrafts, load],
  );

  const openReassign = useCallback((poId: string) => {
    setReassignSupplierId('');
    setReassignOpenPoId(poId);
  }, []);
  const closeReassign = useCallback(() => setReassignOpenPoId(null), []);

  const submitReassign = useCallback(async () => {
    if (!reassignOpenPoId || !reassignSupplierId) return false;
    setSubmittingReassign(true);
    try {
      await repository.reassignPurchaseOrderSupplier(reassignOpenPoId, reassignSupplierId);
      setReassignOpenPoId(null);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingReassign(false);
    }
  }, [repository, reassignOpenPoId, reassignSupplierId, load]);

  const approvePricing = useCallback(
    async (poId: string) => {
      if (!user) return false;
      setApprovingPoId(poId);
      try {
        await repository.approvePurchaseOrderPricing(poId, user.name);
        await load();
        return true;
      } catch {
        return false;
      } finally {
        setApprovingPoId(null);
      }
    },
    [repository, user, load],
  );

  const sendPO = useCallback(
    async (poId: string) => {
      if (!user) return false;
      setSendingPoId(poId);
      try {
        await repository.sendPurchaseOrder(poId, user.name);
        await load();
        return true;
      } catch {
        return false;
      } finally {
        setSendingPoId(null);
      }
    },
    [repository, user, load],
  );

  const draftNow = useCallback(async () => {
    if (!user || !dealId) return false;
    setDraftingNow(true);
    try {
      await repository.draftPurchaseOrdersNow(dealId, user.id);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setDraftingNow(false);
    }
  }, [repository, user, dealId, load]);

  return useMemo(
    () => ({
      draftingNow,
      draftNow,
      status,
      view,
      lineDrafts,
      setLineDraft,
      commitLine,
      deliveryDrafts,
      setDeliveryDraft,
      commitDelivery,
      reassignOpenPoId,
      openReassign,
      closeReassign,
      reassignSupplierId,
      setReassignSupplierId,
      submittingReassign,
      submitReassign,
      approvingPoId,
      approvePricing,
      sendingPoId,
      sendPO,
      reload: load,
    }),
    [
      status,
      view,
      lineDrafts,
      setLineDraft,
      commitLine,
      deliveryDrafts,
      setDeliveryDraft,
      commitDelivery,
      reassignOpenPoId,
      openReassign,
      closeReassign,
      reassignSupplierId,
      submittingReassign,
      submitReassign,
      approvingPoId,
      approvePricing,
      sendingPoId,
      sendPO,
      draftingNow,
      draftNow,
      load,
    ],
  );
}
