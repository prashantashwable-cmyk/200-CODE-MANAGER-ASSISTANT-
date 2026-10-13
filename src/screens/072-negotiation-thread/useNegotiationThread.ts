import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { NegotiationThread } from '@/data/repository';
import type { NegotiationThreadStatus } from './negotiation-thread.types';

interface NegotiationThreadState {
  status: NegotiationThreadStatus;
  thread: NegotiationThread | null;

  takingOver: boolean;
  takeOver: () => Promise<boolean>;

  composerText: string;
  setComposerText: (v: string) => void;
  sending: boolean;
  send: () => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Owns exactly one negotiation's live thread. The composer is only ever
 * wired to `sendNegotiationMessage`, which the repository itself refuses
 * unless a human has already taken over — so this hook can't accidentally
 * let a reply through while the bot still owns the conversation.
 */
export function useNegotiationThread(): NegotiationThreadState {
  const { negotiationId } = useParams<{ negotiationId: string }>();
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<NegotiationThreadStatus>('loading');
  const [thread, setThread] = useState<NegotiationThread | null>(null);
  const [takingOver, setTakingOver] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!negotiationId) {
      setStatus('error');
      return;
    }
    try {
      const result = await repository.getNegotiationThread(negotiationId);
      if (!result) {
        setStatus('error');
        return;
      }
      setThread(result);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, negotiationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const takeOver = useCallback(async () => {
    if (!negotiationId || !user) return false;
    setTakingOver(true);
    try {
      await repository.takeOverNegotiation(negotiationId, user.id);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setTakingOver(false);
    }
  }, [repository, negotiationId, user, load]);

  const send = useCallback(async () => {
    if (!negotiationId || !user || !composerText.trim()) return false;
    setSending(true);
    try {
      await repository.sendNegotiationMessage(negotiationId, composerText.trim(), user.name);
      setComposerText('');
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSending(false);
    }
  }, [repository, negotiationId, user, composerText, load]);

  return {
    status,
    thread,
    takingOver,
    takeOver,
    composerText,
    setComposerText,
    sending,
    send,
    reload: load,
  };
}
