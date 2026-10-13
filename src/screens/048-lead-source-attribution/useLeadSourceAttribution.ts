import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { LeadSourceAttribution } from '@/data/types';
import type { LeadSourceAttributionStatus } from './lead-source-attribution.types';

const POLL_MS = 60_000;

interface LeadSourceAttributionState {
  status: LeadSourceAttributionStatus;
  rows: LeadSourceAttribution[];
  reload: () => Promise<void>;
}

/** Owns the source-breakdown read. `getLeadSourceAttribution` already sorts
 *  nothing for us, so the highest-volume channel is shown first here. */
export function useLeadSourceAttribution(): LeadSourceAttributionState {
  const repository = useData();
  const [status, setStatus] = useState<LeadSourceAttributionStatus>('loading');
  const [rows, setRows] = useState<LeadSourceAttribution[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await repository.getLeadSourceAttribution();
      setRows([...data].sort((a, b) => b.leadCount - a.leadCount));
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

  return { status, rows, reload: load };
}
