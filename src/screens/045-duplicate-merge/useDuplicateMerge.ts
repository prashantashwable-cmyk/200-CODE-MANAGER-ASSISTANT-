import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DuplicatePair, Lead } from '@/data/types';
import type { DuplicateMergeStatus } from './duplicate-merge.types';

const POLL_MS = 30_000;

export type DuplicatePairWithLeads = DuplicatePair & { primary: Lead; secondary: Lead };

interface DuplicateMergeState {
  status: DuplicateMergeStatus;
  pairs: DuplicatePairWithLeads[];
  nameOf: (userId: string) => string;
  resolveMerge: (pairId: string, keepLeadId: string) => Promise<boolean>;
  resolveNotDuplicate: (pairId: string) => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * Owns the admin-facing duplicate queue. `listDuplicatePairs` already joins
 * in the full Lead records for both sides, so the comparison view never has
 * to re-fetch — and every resolution writes through `resolveDuplicatePair`,
 * the one place stage reconciliation and the commission-impact record happen.
 */
export function useDuplicateMerge(): DuplicateMergeState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<DuplicateMergeStatus>('loading');
  const [pairs, setPairs] = useState<DuplicatePairWithLeads[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [list, users] = await Promise.all([repository.listDuplicatePairs(['pending']), repository.listUsers()]);
      setPairs(list);
      setNames(Object.fromEntries(users.map((u) => [u.id, u.name])));
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

  const resolveMerge = useCallback(
    async (pairId: string, keepLeadId: string) => {
      if (!user) return false;
      try {
        await repository.resolveDuplicatePair(pairId, { action: 'merge', primaryLeadId: keepLeadId, actorName: user.name });
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, user, load],
  );

  const resolveNotDuplicate = useCallback(
    async (pairId: string) => {
      if (!user) return false;
      try {
        await repository.resolveDuplicatePair(pairId, { action: 'not_duplicate', actorName: user.name });
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, user, load],
  );

  return { status, pairs, nameOf: (userId) => names[userId] ?? '—', resolveMerge, resolveNotDuplicate, reload: load };
}
