import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useCaptureDraft } from '@/features/leadCapture/CaptureDraftProvider';
import type { DuplicateCheckStatus, DuplicateMatch } from './capture-duplicate.types';

interface CaptureDuplicateState {
  status: DuplicateCheckStatus;
  matches: DuplicateMatch[];
  cancelPromptOpen: boolean;
  markAsDuplicate: () => void;
  confirmCancel: () => void;
  dismissCancelPrompt: () => void;
  proceedAsDifferent: () => void;
  updateExistingLead: (leadId: string) => void;
  continueToNext: () => void;
  recheck: () => Promise<void>;
}

/**
 * Owns the duplicate check — the exact mechanic that keeps the commission
 * model fraud-resistant without slowing a genuinely new site down.
 *
 * A lead already marked lost is excluded from matching: it has effectively
 * been invalidated, and continuing to flag against it would block legitimate
 * new captures at the same address for no reason.
 */
export function useCaptureDuplicate(): CaptureDuplicateState {
  const navigate = useNavigate();
  const repository = useData();
  const { user } = useSession();
  const { draft, update, reset } = useCaptureDraft();

  const [status, setStatus] = useState<DuplicateCheckStatus>('checking');
  const [matches, setMatches] = useState<DuplicateMatch[]>([]);
  const [cancelPromptOpen, setCancelPromptOpen] = useState(false);

  const runCheck = useCallback(async () => {
    if (!draft.location) {
      setStatus('clear');
      return;
    }
    setStatus('checking');
    try {
      const [found, surveyors] = await Promise.all([
        repository.findDuplicateLeads({
          location: draft.location,
          siteName: draft.siteName || draft.address,
          contactPhone: draft.contactPhone || undefined,
        }),
        repository.listUsers({ role: 'surveyor' }),
      ]);
      const nameById = new Map(surveyors.map((u) => [u.id, u.name]));
      const active = found.filter((match) => match.lead.stage !== 'lost');
      const mapped: DuplicateMatch[] = active.map((match) => ({
        lead: match.lead,
        distanceMetres: match.distanceMetres,
        reason: match.reason,
        isOwnLead: match.lead.surveyorId === user?.id,
        surveyorName: nameById.get(match.lead.surveyorId) ?? match.lead.surveyorId,
      }));
      setMatches(mapped);
      setStatus(mapped.length > 0 ? 'flagged' : 'clear');
    } catch {
      setStatus('error');
    }
  }, [repository, draft.location, draft.siteName, draft.address, draft.contactPhone, user?.id]);

  useEffect(() => {
    void runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsDuplicate = useCallback(() => setCancelPromptOpen(true), []);
  const dismissCancelPrompt = useCallback(() => setCancelPromptOpen(false), []);

  const confirmCancel = useCallback(() => {
    reset();
    navigate('/surveyor', { replace: true });
  }, [reset, navigate]);

  const proceedAsDifferent = useCallback(() => {
    // Overriding the warning never silently blocks the surveyor — it proceeds
    // but is queued for a lightweight admin review, preserving field judgment
    // while protecting commission integrity.
    update({ duplicateAcknowledged: true, duplicateOfLeadId: matches[0]?.lead.id });
    navigate('/surveyor/capture/confirm');
  }, [update, matches, navigate]);

  const updateExistingLead = useCallback(
    (leadId: string) => {
      reset();
      navigate(`/surveyor/leads?open=${leadId}`);
    },
    [reset, navigate],
  );

  const continueToNext = useCallback(() => {
    update({ duplicateAcknowledged: true });
    navigate('/surveyor/capture/confirm');
  }, [update, navigate]);

  return {
    status,
    matches,
    cancelPromptOpen,
    markAsDuplicate,
    confirmCancel,
    dismissCancelPrompt,
    proceedAsDifferent,
    updateExistingLead,
    continueToNext,
    recheck: runCheck,
  };
}
