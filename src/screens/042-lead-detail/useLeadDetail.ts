import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Deal, Lead, LeadStage, LeadTimelineEvent, User } from '@/data/types';
import type { LeadDetailStatus } from './lead-detail.types';

const POLL_MS = 20_000;

interface LeadDetailState {
  status: LeadDetailStatus;
  lead: Lead | null;
  timeline: LeadTimelineEvent[];
  deal: Deal | null;
  surveyorName: string;
  surveyors: User[];
  canAdvanceToQuoted: boolean;
  canAdvanceToWon: boolean;
  changeStage: (stage: LeadStage) => Promise<boolean>;
  addNote: (note: string) => Promise<boolean>;
  scheduleFollowUp: (title: string, dueDate: string, assignedTo: string) => Promise<boolean>;
  sendMessage: (message: string) => Promise<boolean>;
  reopen: () => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * Owns the full 360° view of one lead. Every mutating action here goes
 * through the same repository calls the list/Kanban/scheduler screens use —
 * this screen is not a separate write path, so a stage change made here is
 * exactly as authoritative as one made by dragging a Kanban card.
 */
export function useLeadDetail(): LeadDetailState {
  const { leadId } = useParams<{ leadId: string }>();
  const repository = useData();
  const { user } = useSession();

  const [status, setStatus] = useState<LeadDetailStatus>('loading');
  const [lead, setLead] = useState<Lead | null>(null);
  const [timeline, setTimeline] = useState<LeadTimelineEvent[]>([]);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [surveyorName, setSurveyorName] = useState('');
  const [surveyors, setSurveyors] = useState<User[]>([]);

  const load = useCallback(async () => {
    if (!leadId) return;
    try {
      const [foundLead, events, deals, surveyorList] = await Promise.all([
        repository.getLead(leadId),
        repository.listLeadTimeline(leadId),
        repository.listDeals(),
        repository.listUsers({ role: 'surveyor', status: 'active' }),
      ]);
      if (!foundLead) {
        setStatus('not_found');
        return;
      }
      setLead(foundLead);
      setTimeline(events);
      setDeal(deals.find((d) => d.leadId === leadId) ?? null);
      setSurveyors(surveyorList);
      const owner = foundLead.surveyorId ? await repository.getUser(foundLead.surveyorId) : null;
      setSurveyorName(owner?.name ?? '');
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, leadId]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const changeStage = useCallback(
    async (stage: LeadStage) => {
      if (!lead) return false;
      try {
        await repository.updateLead(lead.id, { stage });
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, lead, load],
  );

  const addNote = useCallback(
    async (note: string) => {
      if (!lead || !user || !note.trim()) return false;
      try {
        await repository.addLeadNote(lead.id, note.trim(), user.name);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, lead, user, load],
  );

  const scheduleFollowUp = useCallback(
    async (title: string, dueDate: string, assignedTo: string) => {
      if (!lead || !title.trim() || !dueDate || !assignedTo) return false;
      try {
        await repository.createFollowUpTask({ leadId: lead.id, title: title.trim(), dueDate, assignedTo });
        return true;
      } catch {
        return false;
      }
    },
    [repository, lead],
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (!lead || !user || !message.trim()) return false;
      try {
        await repository.sendLeadMessage(lead.id, message.trim(), user.name);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, lead, user, load],
  );

  const reopen = useCallback(async () => {
    if (!lead || !user) return false;
    try {
      await repository.reopenLead(lead.id, user.name);
      await load();
      return true;
    } catch {
      return false;
    }
  }, [repository, lead, user, load]);

  return {
    status,
    lead,
    timeline,
    deal,
    surveyorName,
    surveyors,
    canAdvanceToQuoted: deal !== null,
    // No separate Contract entity exists yet (that lands with the deal-closing
    // module) — an agreed price on the linked deal is the closest real proxy
    // for "terms are settled", so that's the gate until a signed-contract
    // record exists to check instead.
    canAdvanceToWon: (deal?.agreedPrice ?? 0) > 0,
    changeStage,
    addNote,
    scheduleFollowUp,
    sendMessage,
    reopen,
    reload: load,
  };
}
