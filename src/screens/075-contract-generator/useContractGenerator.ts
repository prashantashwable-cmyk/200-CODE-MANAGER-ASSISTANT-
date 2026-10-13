import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ContractView } from '@/data/repository';
import type { ContractGeneratorStatus } from './contract-generator.types';

interface ContractGeneratorState {
  status: ContractGeneratorStatus;
  view: ContractView | null;

  generating: boolean;
  generate: () => Promise<boolean>;

  addendumSheetOpen: boolean;
  openAddendumSheet: () => void;
  closeAddendumSheet: () => void;
  addendumNote: string;
  setAddendumNote: (v: string) => void;
  addingAddendum: boolean;
  submitAddendum: () => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Owns one deal's contract. Generation is a single call that both creates
 * the first version and, called again later, supersedes the current one —
 * this hook never edits clause text directly, since the repository has no
 * such method: a contract only ever changes by a fresh, fully-regenerated
 * version.
 */
export function useContractGenerator(): ContractGeneratorState {
  const { dealId } = useParams<{ dealId: string }>();
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<ContractGeneratorStatus>('loading');
  const [view, setView] = useState<ContractView | null>(null);
  const [generating, setGenerating] = useState(false);

  const [addendumSheetOpen, setAddendumSheetOpen] = useState(false);
  const [addendumNote, setAddendumNote] = useState('');
  const [addingAddendum, setAddingAddendum] = useState(false);

  const load = useCallback(async () => {
    if (!dealId) {
      setStatus('error');
      return;
    }
    try {
      const result = await repository.getContract(dealId);
      if (!result) {
        setStatus('error');
        return;
      }
      setView(result);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  const generate = useCallback(async () => {
    if (!dealId || !user) return false;
    setGenerating(true);
    try {
      await repository.generateContract(dealId, user.id);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setGenerating(false);
    }
  }, [repository, dealId, user, load]);

  const openAddendumSheet = useCallback(() => {
    setAddendumNote('');
    setAddendumSheetOpen(true);
  }, []);
  const closeAddendumSheet = useCallback(() => setAddendumSheetOpen(false), []);

  const submitAddendum = useCallback(async () => {
    const contractId = view?.contract?.id;
    if (!contractId || !user || !addendumNote.trim()) return false;
    setAddingAddendum(true);
    try {
      await repository.addContractAddendum(contractId, addendumNote.trim(), user.id);
      await load();
      setAddendumSheetOpen(false);
      return true;
    } catch {
      return false;
    } finally {
      setAddingAddendum(false);
    }
  }, [repository, view, user, addendumNote, load]);

  return {
    status,
    view,
    generating,
    generate,
    addendumSheetOpen,
    openAddendumSheet,
    closeAddendumSheet,
    addendumNote,
    setAddendumNote,
    addingAddendum,
    submitAddendum,
    reload: load,
  };
}
