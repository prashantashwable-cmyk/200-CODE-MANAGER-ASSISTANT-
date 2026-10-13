import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CommChannel, OptOutChannel, OptOutEvent } from '@/data/types';
import type { ChannelComplianceStatus, ContactFilter, OptOutManagerStatus } from './opt-out-manager.types';
import { CHANNELS } from './opt-out-manager.types';

export interface ChannelStatusInfo {
  status: ChannelComplianceStatus;
  at: string;
  source: OptOutEvent['source'];
  reason?: string;
}

export interface ContactRow {
  contactPhone: string;
  contactName: string;
  perChannel: Partial<Record<CommChannel, ChannelStatusInfo>>;
  worstStatus: ChannelComplianceStatus;
  latestAt: string;
}

interface OptOutManagerState {
  status: OptOutManagerStatus;
  rows: ContactRow[];
  filter: ContactFilter;
  setFilter: (f: ContactFilter) => void;
  query: string;
  setQuery: (q: string) => void;
  sheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  addEntry: (input: {
    contactName: string;
    contactPhone: string;
    channel: OptOutChannel;
    type: OptOutEvent['type'];
    source: OptOutEvent['source'];
    reason?: string;
  }) => Promise<boolean>;
  exportAudit: () => void;
  reload: () => Promise<void>;
}

function classify(event: OptOutEvent): ChannelComplianceStatus {
  if (event.type === 'opted_in') return 'clear';
  return event.source === 'dnd_registry' ? 'dnd' : 'opted_out';
}

const STATUS_RANK: Record<ChannelComplianceStatus, number> = { dnd: 2, opted_out: 1, clear: 0 };

function buildRows(events: OptOutEvent[]): ContactRow[] {
  const byPhone = new Map<string, OptOutEvent[]>();
  for (const event of events) {
    const list = byPhone.get(event.contactPhone) ?? [];
    list.push(event);
    byPhone.set(event.contactPhone, list);
  }

  const rows: ContactRow[] = [];
  for (const [contactPhone, contactEvents] of byPhone) {
    const sorted = [...contactEvents].sort((a, b) => b.at.localeCompare(a.at));
    const contactName = sorted[0].contactName;
    const perChannel: Partial<Record<CommChannel, ChannelStatusInfo>> = {};
    for (const channel of CHANNELS) {
      const relevant = sorted.filter((e) => e.channel === channel || e.channel === 'all');
      if (relevant.length === 0) continue;
      const latest = relevant[0];
      perChannel[channel] = { status: classify(latest), at: latest.at, source: latest.source, reason: latest.reason };
    }
    const worstStatus = Object.values(perChannel).reduce<ChannelComplianceStatus>(
      (worst, info) => (STATUS_RANK[info.status] > STATUS_RANK[worst] ? info.status : worst),
      'clear',
    );
    rows.push({ contactPhone, contactName, perChannel, worstStatus, latestAt: sorted[0].at });
  }

  return rows.sort((a, b) => b.latestAt.localeCompare(a.latestAt));
}

/**
 * Owns the compliance list, computed from the append-only opt-out event
 * log: per channel, whichever event (channel-specific or 'all') has the
 * latest timestamp wins — the same "latest wins" rule the send-blocking
 * check (`isOptedOut`) uses everywhere else, so this screen's read of
 * "who's currently restricted" always agrees with what actually blocks a send.
 */
export function useOptOutManager(): OptOutManagerState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<OptOutManagerStatus>('loading');
  const [events, setEvents] = useState<OptOutEvent[]>([]);
  const [filter, setFilter] = useState<ContactFilter>('all');
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await repository.listOptOutEvents();
      setEvents(list);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const allRows = useMemo(() => buildRows(events), [events]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows
      .filter((r) => filter === 'all' || r.worstStatus === filter)
      .filter((r) => !q || r.contactName.toLowerCase().includes(q) || r.contactPhone.includes(q));
  }, [allRows, filter, query]);

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const addEntry = useCallback(
    async (input: {
      contactName: string;
      contactPhone: string;
      channel: OptOutChannel;
      type: OptOutEvent['type'];
      source: OptOutEvent['source'];
      reason?: string;
    }) => {
      try {
        await repository.recordOptOutEvent({ ...input, recordedBy: user?.name ?? 'Admin' });
        await load();
        setSheetOpen(false);
        return true;
      } catch {
        return false;
      }
    },
    [repository, user, load],
  );

  const exportAudit = useCallback(() => {
    const header = ['contactName', 'contactPhone', 'channel', 'type', 'source', 'reason', 'at', 'recordedBy'];
    const csv = [
      header.join(','),
      ...[...events]
        .sort((a, b) => b.at.localeCompare(a.at))
        .map((e) =>
          [e.contactName, e.contactPhone, e.channel, e.type, e.source, e.reason ?? '', e.at, e.recordedBy]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(','),
        ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aiec-opt-out-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events]);

  return { status, rows, filter, setFilter, query, setQuery, sheetOpen, openSheet, closeSheet, addEntry, exportAudit, reload: load };
}
