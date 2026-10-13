import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { ReplyInboxItem } from '@/data/repository';
import type { User } from '@/data/types';
import type { ReplyInboxStatus } from './reply-inbox.types';

export interface ReplyInboxRow {
  item: ReplyInboxItem;
  channel: 'whatsapp' | 'sms' | 'call';
  relatedCount: number;
  assignedAgentName: string | null;
}

interface ReplyInboxState {
  status: ReplyInboxStatus;
  rows: ReplyInboxRow[];
  agents: User[];
  assigningItem: ReplyInboxItem | null;
  openAssign: (item: ReplyInboxItem) => void;
  closeAssign: () => void;
  assign: (agentId: string) => Promise<boolean>;
  markHandled: (item: ReplyInboxItem) => Promise<boolean>;
  callBack: (item: ReplyInboxItem) => Promise<boolean>;
  reload: () => Promise<void>;
}

const POLL_MS = 20_000;

/**
 * Owns the unified reply inbox — one priority-sorted list over WhatsApp/SMS
 * replies and missed-call-back requests, all backed by the same
 * conversation and call-log records shown on their own dedicated screens.
 */
export function useReplyInbox(): ReplyInboxState {
  const repository = useData();
  const [status, setStatus] = useState<ReplyInboxStatus>('loading');
  const [items, setItems] = useState<ReplyInboxItem[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [assigningItem, setAssigningItem] = useState<ReplyInboxItem | null>(null);

  const load = useCallback(async () => {
    try {
      const [inboxItems, agentList] = await Promise.all([repository.listReplyInboxItems(), repository.listUsers({ role: 'admin' })]);
      setItems(inboxItems);
      setAgents(agentList);
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

  const rows = useMemo<ReplyInboxRow[]>(() => {
    const countByLead = new Map<string, number>();
    for (const item of items) countByLead.set(item.lead.id, (countByLead.get(item.lead.id) ?? 0) + 1);

    return items.map((item) => {
      const channel = item.kind === 'missed_call' ? 'call' : item.message.channel === 'whatsapp' ? 'whatsapp' : 'sms';
      const assignedAgentName =
        item.kind === 'message' && item.conversation.assignedAgentId
          ? (agents.find((a) => a.id === item.conversation.assignedAgentId)?.name ?? null)
          : null;
      return { item, channel, relatedCount: (countByLead.get(item.lead.id) ?? 1) - 1, assignedAgentName };
    });
  }, [items, agents]);

  const openAssign = useCallback((item: ReplyInboxItem) => setAssigningItem(item), []);
  const closeAssign = useCallback(() => setAssigningItem(null), []);

  const assign = useCallback(
    async (agentId: string) => {
      if (!assigningItem || assigningItem.kind !== 'message') return false;
      try {
        await repository.assignConversation(assigningItem.conversation.id, agentId);
        await load();
        setAssigningItem(null);
        return true;
      } catch {
        return false;
      }
    },
    [repository, assigningItem, load],
  );

  const markHandled = useCallback(
    async (item: ReplyInboxItem) => {
      if (item.kind !== 'message') return false;
      try {
        await repository.markMessageHandled(item.message.id);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, load],
  );

  const callBack = useCallback(
    async (item: ReplyInboxItem) => {
      if (item.kind !== 'missed_call') return false;
      try {
        const call = await repository.logCall(item.lead.id, 'auto_dialer');
        if (item.lead.contactPhone) window.location.href = `tel:${item.lead.contactPhone}`;
        await load();
        return !!call;
      } catch {
        return false;
      }
    },
    [repository, load],
  );

  return { status, rows, agents, assigningItem, openAssign, closeAssign, assign, markHandled, callBack, reload: load };
}
