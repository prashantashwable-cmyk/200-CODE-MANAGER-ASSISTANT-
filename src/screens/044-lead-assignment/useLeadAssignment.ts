import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Lead, User } from '@/data/types';
import type { LeadAssignmentStatus, Suggestion } from './lead-assignment.types';

const POLL_MS = 30_000;

interface LeadAssignmentState {
  status: LeadAssignmentStatus;
  queue: Lead[];
  suggestions: Record<string, Suggestion | null>;
  surveyors: User[];
  assignLead: (leadId: string, toSurveyorId: string, reason: string) => Promise<boolean>;

  sourceSurveyorId: string;
  setSourceSurveyorId: (id: string) => void;
  sourceSurveyorLeads: Lead[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  bulkReassign: (toSurveyorId: string, reason: string) => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Owns the "who owns this lead" workflow: the unassigned queue with a
 * proximity/workload-based suggestion per lead, and territory-wide bulk
 * redistribution off one surveyor's book. Both paths write through
 * `reassignLead`/`bulkReassignLeads`, which is also what logs the mandatory
 * reason to the Lead Detail timeline — this screen never mutates ownership
 * any other way.
 */
export function useLeadAssignment(): LeadAssignmentState {
  const repository = useData();
  const { user } = useSession();

  const [status, setStatus] = useState<LeadAssignmentStatus>('loading');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [surveyors, setSurveyors] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion | null>>({});
  const [sourceSurveyorId, setSourceSurveyorId] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const [leadList, surveyorList] = await Promise.all([
        repository.listLeads({ sort: 'stale' }),
        repository.listUsers({ role: 'surveyor', status: 'active' }),
      ]);
      setLeads(leadList);
      setSurveyors(surveyorList);
      const queue = leadList.filter((l) => !l.surveyorId);
      const pairs = await Promise.all(queue.map(async (l) => [l.id, await repository.suggestAssignee(l.id)] as const));
      setSuggestions(Object.fromEntries(pairs));
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const queue = useMemo(() => leads.filter((l) => !l.surveyorId), [leads]);

  const sourceSurveyorLeads = useMemo(
    () => (sourceSurveyorId ? leads.filter((l) => l.surveyorId === sourceSurveyorId && l.stage !== 'won' && l.stage !== 'lost') : []),
    [leads, sourceSurveyorId],
  );

  const assignLead = useCallback(
    async (leadId: string, toSurveyorId: string, reason: string) => {
      if (!user || !reason.trim()) return false;
      try {
        await repository.reassignLead(leadId, toSurveyorId, reason.trim(), user.name);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, user, load],
  );

  const bulkReassign = useCallback(
    async (toSurveyorId: string, reason: string) => {
      if (!user || !reason.trim() || selectedIds.size === 0) return false;
      try {
        await repository.bulkReassignLeads([...selectedIds], toSurveyorId, reason.trim(), user.name);
        setSelectedIds(new Set());
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, user, selectedIds, load],
  );

  return {
    status,
    queue,
    suggestions,
    surveyors,
    assignLead,
    sourceSurveyorId,
    setSourceSurveyorId: (id) => {
      setSourceSurveyorId(id);
      setSelectedIds(new Set());
    },
    sourceSurveyorLeads,
    selectedIds,
    toggleSelect: (id) =>
      setSelectedIds((cur) => {
        const next = new Set(cur);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    selectAll: () => setSelectedIds(new Set(sourceSurveyorLeads.map((l) => l.id))),
    clearSelection: () => setSelectedIds(new Set()),
    bulkReassign,
    reload: load,
  };
}
