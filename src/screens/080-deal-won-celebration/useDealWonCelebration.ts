import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DealCelebrationView } from '@/data/repository';
import type { DealWonCelebrationStatus } from './deal-won-celebration.types';

interface DealWonCelebrationState {
  status: DealWonCelebrationStatus;
  view: DealCelebrationView | null;
  isAdminViewer: boolean;

  feedbackNote: string;
  setFeedbackNote: (v: string) => void;
  feedbackSubmitted: boolean;
  acknowledging: boolean;
  acknowledge: () => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Owns the internal celebration moment for one won deal. Mirrors screen
 * 077's own read/trigger split: loading this screen for an eligible deal
 * that hasn't been celebrated yet creates the `DealCelebration` record as
 * part of the load, so the moment persists (for a staff member who was
 * offline when the deal actually closed) rather than depending on a
 * fleeting push notification they might miss.
 */
export function useDealWonCelebration(): DealWonCelebrationState {
  const { dealId } = useParams<{ dealId: string }>();
  const repository = useData();
  const { user, role } = useSession();
  const [status, setStatus] = useState<DealWonCelebrationStatus>('loading');
  const [view, setView] = useState<DealCelebrationView | null>(null);

  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);

  const isAdminViewer = role === 'admin';

  const load = useCallback(async () => {
    if (!dealId || !role) {
      setStatus('error');
      return;
    }
    try {
      let result = await repository.getDealCelebration(dealId, role);
      if (!result) {
        setStatus('error');
        return;
      }
      if (result.eligible && !result.celebration) {
        await repository.triggerDealCelebration(dealId);
        result = await repository.getDealCelebration(dealId, role);
        if (!result) {
          setStatus('error');
          return;
        }
      }
      setView(result);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, dealId, role]);

  useEffect(() => {
    void load();
  }, [load]);

  const acknowledge = useCallback(async () => {
    if (!dealId || !user) return false;
    setAcknowledging(true);
    try {
      await repository.acknowledgeDealCelebration(dealId, user.id, feedbackNote.trim() || undefined);
      if (feedbackNote.trim()) setFeedbackSubmitted(true);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setAcknowledging(false);
    }
  }, [repository, dealId, user, feedbackNote, load]);

  return {
    status,
    view,
    isAdminViewer,
    feedbackNote,
    setFeedbackNote,
    feedbackSubmitted,
    acknowledging,
    acknowledge,
    reload: load,
  };
}
