import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DealClosureView, TransitEstimate } from '@/data/repository';
import type { User } from '@/data/types';
import type { DealClosureConfirmationStatus } from './deal-closure-confirmation.types';

interface DealClosureConfirmationState {
  status: DealClosureConfirmationStatus;
  view: DealClosureView | null;
  contact: User | null;
  /** How long parts really take to reach this site's city (110), so the timeline a customer hears is the real one. */
  estimate: TransitEstimate | null;

  voidSheetOpen: boolean;
  openVoidSheet: () => void;
  closeVoidSheet: () => void;
  voidReason: string;
  setVoidReason: (v: string) => void;
  voiding: boolean;
  submitVoid: () => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Owns the single, reliable kickoff event for one deal. Loading this screen
 * for a deal that's fully signed but hasn't been through its kickoff yet
 * triggers it automatically as part of the load — the same "no manual
 * follow-through" precedent screen 064's own view-recording follows —
 * rather than gating it behind a separate confirmation tap.
 */
export function useDealClosureConfirmation(): DealClosureConfirmationState {
  const { dealId } = useParams<{ dealId: string }>();
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<DealClosureConfirmationStatus>('loading');
  const [view, setView] = useState<DealClosureView | null>(null);
  const [contact, setContact] = useState<User | null>(null);
  const [estimate, setEstimate] = useState<TransitEstimate | null>(null);

  const [voidSheetOpen, setVoidSheetOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  const load = useCallback(async () => {
    if (!dealId) {
      setStatus('error');
      return;
    }
    try {
      let result = await repository.getDealClosure(dealId);
      if (!result) {
        setStatus('error');
        return;
      }
      if (result.eligibleToClose && !result.closure) {
        await repository.triggerDealClosure(dealId);
        result = await repository.getDealClosure(dealId);
        if (!result) {
          setStatus('error');
          return;
        }
      }
      setView(result);
      // The timeline shown is what deliveries to this city have really taken, not a guess.
      if (user && result.lead.city) setEstimate(await repository.getTransitEstimate(result.lead.city, user.id).catch(() => null));
      if (result.lead.originalSurveyorId) {
        setContact(await repository.getUser(result.lead.originalSurveyorId));
      }
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, dealId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const openVoidSheet = useCallback(() => {
    setVoidReason('');
    setVoidSheetOpen(true);
  }, []);
  const closeVoidSheet = useCallback(() => setVoidSheetOpen(false), []);

  const submitVoid = useCallback(async () => {
    if (!dealId || !user || !voidReason.trim()) return false;
    setVoiding(true);
    try {
      await repository.voidDealClosure(dealId, voidReason.trim(), user.id);
      await load();
      setVoidSheetOpen(false);
      return true;
    } catch {
      return false;
    } finally {
      setVoiding(false);
    }
  }, [repository, dealId, user, voidReason, load]);

  return {
    status,
    view,
    contact,
    estimate,
    voidSheetOpen,
    openVoidSheet,
    closeVoidSheet,
    voidReason,
    setVoidReason,
    voiding,
    submitVoid,
    reload: load,
  };
}
