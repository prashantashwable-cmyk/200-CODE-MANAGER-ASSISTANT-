import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ConversationWithContext } from '@/data/repository';
import type { CommTemplate, User } from '@/data/types';
import type { WhatsappConsoleStatus } from './whatsapp-console.types';
import { OPT_OUT_KEYWORDS } from './whatsapp-console.types';

const POLL_MS = 20_000;

interface WhatsappConsoleState {
  status: WhatsappConsoleStatus;
  conversations: ConversationWithContext[];
  agents: User[];
  selectedId: string | null;
  select: (id: string) => void;
  closeThread: () => void;
  selected: ConversationWithContext | undefined;
  quickReplyTemplates: CommTemplate[];
  composerText: string;
  setComposerText: (text: string) => void;
  send: () => Promise<boolean>;
  assign: (agentId: string) => Promise<boolean>;
  claim: () => Promise<boolean>;
  optOutTriggered: boolean;
  optOutConfirmed: boolean;
  confirmOptOut: () => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * Owns the unified WhatsApp conversation list and the open thread. Every
 * message here is the same `CommMessage` record every other communication
 * screen reads — sending from here writes through `sendAgentMessage`, which
 * is also what pauses the lead's active sequence for a cool-down window.
 */
export function useWhatsappConsole(): WhatsappConsoleState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<WhatsappConsoleStatus>('loading');
  const [conversations, setConversations] = useState<ConversationWithContext[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [templates, setTemplates] = useState<CommTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composerText, setComposerText] = useState('');

  const load = useCallback(async () => {
    try {
      const [convs, agentList, tpls] = await Promise.all([
        repository.listConversations(),
        repository.listUsers({ role: 'admin' }),
        repository.listCommTemplates({ channel: 'whatsapp', language: 'en' }),
      ]);
      setConversations(convs);
      setAgents(agentList);
      setTemplates(tpls.filter((t) => t.status === 'active'));
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

  const selected = useMemo(() => conversations.find((c) => c.id === selectedId), [conversations, selectedId]);

  const lastCustomerOptOutMatch = useMemo(() => {
    const lastCustomerMessage = [...(selected?.messages ?? [])].reverse().find((m) => m.sender === 'customer');
    if (!lastCustomerMessage) return null;
    const lower = lastCustomerMessage.body.toLowerCase().trim();
    return OPT_OUT_KEYWORDS.some((kw) => lower === kw || lower.includes(kw)) ? lastCustomerMessage : null;
  }, [selected]);

  const optOutTriggered = Boolean(lastCustomerOptOutMatch && !lastCustomerOptOutMatch.handled);
  const optOutConfirmed = Boolean(lastCustomerOptOutMatch?.handled);

  const send = useCallback(async () => {
    if (!selected || !user || !composerText.trim()) return false;
    try {
      await repository.sendAgentMessage(selected.id, composerText.trim(), user.name);
      setComposerText('');
      await load();
      return true;
    } catch {
      return false;
    }
  }, [repository, selected, user, composerText, load]);

  const assign = useCallback(
    async (agentId: string) => {
      if (!selected) return false;
      try {
        await repository.assignConversation(selected.id, agentId);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, selected, load],
  );

  const claim = useCallback(async () => {
    if (!user) return false;
    return assign(user.id);
  }, [assign, user]);

  const confirmOptOut = useCallback(async () => {
    if (!selected || !user) return false;
    try {
      await repository.recordOptOutEvent({
        contactPhone: selected.lead.contactPhone,
        contactName: selected.lead.contactName,
        channel: 'all',
        type: 'opted_out',
        source: 'stop_keyword',
        recordedBy: user.name,
      });
      const lastCustomerMessage = [...selected.messages].reverse().find((m) => m.sender === 'customer');
      if (lastCustomerMessage) await repository.markMessageHandled(lastCustomerMessage.id);
      await load();
      return true;
    } catch {
      return false;
    }
  }, [repository, selected, user, load]);

  return {
    status,
    conversations,
    agents,
    selectedId,
    select: setSelectedId,
    closeThread: () => setSelectedId(null),
    selected,
    quickReplyTemplates: templates,
    composerText,
    setComposerText,
    send,
    assign,
    claim,
    optOutTriggered,
    optOutConfirmed,
    confirmOptOut,
    reload: load,
  };
}
