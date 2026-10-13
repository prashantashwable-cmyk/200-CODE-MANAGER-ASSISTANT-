import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Lead, LeadTimelineEvent, User } from '@/data/types';
import type { LostLeadStatus, LostReasonKey } from './lost-lead.types';

interface LostLeadState {
  status: LostLeadStatus;
  lead: Lead | null;
  recentEvents: LeadTimelineEvent[];
  ownerName: string;
  submit: (reasonKey: LostReasonKey, note: string, revisitMonths: number) => Promise<boolean>;
  reopen: () => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * Owns the single-lead disqualification flow. Reached from the Lead Detail
 * screen's "Mark lost" action — this is the one place a lead's history gets
 * one more glance before the decision, per the spec's "quick decision worth
 * a final look" requirement.
 */
export function useLostLead(): LostLeadState {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const repository = useData();
  const { user } = useSession();

  const [status, setStatus] = useState<LostLeadStatus>('loading');
  const [lead, setLead] = useState<Lead | null>(null);
  const [recentEvents, setRecentEvents] = useState<LeadTimelineEvent[]>([]);
  const [owner, setOwner] = useState<User | null>(null);

  const load = useCallback(async () => {
    if (!leadId) return;
    try {
      const foundLead = await repository.getLead(leadId);
      if (!foundLead) {
        setStatus('not_found');
        return;
      }
      const [events, ownerUser] = await Promise.all([
        repository.listLeadTimeline(leadId),
        foundLead.surveyorId ? repository.getUser(foundLead.surveyorId) : Promise.resolve(null),
      ]);
      setLead(foundLead);
      setRecentEvents(events.slice(-3).reverse());
      setOwner(ownerUser);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(
    async (reasonKey: LostReasonKey, note: string, revisitMonths: number) => {
      if (!lead || !user) return false;
      try {
        const revisitReminderDate =
          revisitMonths > 0 ? new Date(Date.now() + revisitMonths * 30 * 86_400_000).toISOString() : undefined;
        await repository.markLeadLost(lead.id, { reasonKey, note: note.trim() || undefined, revisitReminderDate, actorName: user.name });
        navigate(`/admin/leads/${lead.id}`);
        return true;
      } catch {
        return false;
      }
    },
    [repository, lead, user, navigate],
  );

  const reopen = useCallback(async () => {
    if (!lead || !user) return false;
    try {
      await repository.reopenLead(lead.id, user.name);
      navigate(`/admin/leads/${lead.id}`);
      return true;
    } catch {
      return false;
    }
  }, [repository, lead, user, navigate]);

  return { status, lead, recentEvents, ownerName: owner?.name ?? '', submit, reopen, reload: load };
}
