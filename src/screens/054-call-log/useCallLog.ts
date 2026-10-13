import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { CallLogEntry, CallOutcome, Lead } from '@/data/types';
import type { CallLogStatus } from './call-log.types';
import { DISPOSITION_REMINDER_HOURS, NO_ANSWER_SWITCH_THRESHOLD } from './call-log.types';

const POLL_MS = 20_000;

export interface CallLogRow {
  call: CallLogEntry;
  lead: Lead | null;
  needsDispositionReminder: boolean;
  suggestChannelSwitch: boolean;
}

interface CallLogState {
  status: CallLogStatus;
  rows: CallLogRow[];
  leadOptions: Lead[];
  pickedLeadId: string;
  setPickedLeadId: (id: string) => void;
  callNow: () => Promise<CallLogEntry | null>;
  logManualCall: (leadId: string, outcome: CallOutcome, durationSec: number, consentGiven: boolean) => Promise<boolean>;
  disposition: (id: string, outcome: CallOutcome, durationSec: number) => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * Owns the call log. Click-to-call genuinely opens the device dialer (a
 * `tel:` link); this hook's job is just keeping the log itself real —
 * logging the attempt, and letting a disposition feed straight back into
 * the same `updateLead`/scoring path every other CRM screen uses.
 */
export function useCallLog(): CallLogState {
  const repository = useData();
  const [status, setStatus] = useState<CallLogStatus>('loading');
  const [calls, setCalls] = useState<CallLogEntry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pickedLeadId, setPickedLeadId] = useState('');

  const load = useCallback(async () => {
    try {
      const [callList, leadList] = await Promise.all([repository.listCallLog(), repository.listLeads({ sort: 'recent' })]);
      setCalls(callList);
      setLeads(leadList);
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

  const rows = useMemo<CallLogRow[]>(() => {
    const now = Date.now();
    // Per lead, walk newest-first and count a true no-answer streak,
    // skipping pocket dials entirely rather than treating them as a break
    // or a meaningful attempt.
    const streakByLead = new Map<string, number>();
    const sorted = [...calls].sort((a, b) => b.at.localeCompare(a.at));
    const byLead = new Map<string, CallLogEntry[]>();
    for (const call of sorted) {
      const list = byLead.get(call.leadId) ?? [];
      list.push(call);
      byLead.set(call.leadId, list);
    }
    for (const [leadId, list] of byLead) {
      let streak = 0;
      for (const call of list) {
        if (call.outcome === 'pocket_dial') continue;
        if (call.outcome === 'no_answer') {
          streak += 1;
          continue;
        }
        break;
      }
      streakByLead.set(leadId, streak);
    }

    return sorted.map((call) => {
      // Only flag it once, on the newest call for that lead — not repeated
      // on every older row in the same streak.
      const isNewestForLead = byLead.get(call.leadId)?.[0]?.id === call.id;
      return {
        call,
        lead: leads.find((l) => l.id === call.leadId) ?? null,
        needsDispositionReminder: call.outcome === null && now - new Date(call.at).getTime() > DISPOSITION_REMINDER_HOURS * 3_600_000,
        suggestChannelSwitch: isNewestForLead && (streakByLead.get(call.leadId) ?? 0) >= NO_ANSWER_SWITCH_THRESHOLD,
      };
    });
  }, [calls, leads]);

  const callNow = useCallback(async () => {
    if (!pickedLeadId) return null;
    try {
      const call = await repository.logCall(pickedLeadId, 'auto_dialer');
      const lead = leads.find((l) => l.id === pickedLeadId);
      if (lead?.contactPhone) window.location.href = `tel:${lead.contactPhone}`;
      await load();
      return call;
    } catch {
      return null;
    }
  }, [repository, pickedLeadId, leads, load]);

  const logManualCall = useCallback(
    async (leadId: string, outcome: CallOutcome, durationSec: number, consentGiven: boolean) => {
      try {
        const call = await repository.logCall(leadId, 'manual');
        await repository.setCallDisposition(call.id, outcome, durationSec, consentGiven);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, load],
  );

  const disposition = useCallback(
    async (id: string, outcome: CallOutcome, durationSec: number) => {
      try {
        await repository.setCallDisposition(id, outcome, durationSec);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, load],
  );

  return { status, rows, leadOptions: leads, pickedLeadId, setPickedLeadId, callNow, logManualCall, disposition, reload: load };
}
