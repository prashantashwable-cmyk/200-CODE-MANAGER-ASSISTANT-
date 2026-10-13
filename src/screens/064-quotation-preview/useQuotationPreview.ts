import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CustomerQuotationView } from '@/data/repository';
import type { QuotationPreviewStatus } from './quotation-preview.types';

interface QuotationPreviewState {
  status: QuotationPreviewStatus;
  view: CustomerQuotationView | null;

  accepting: boolean;
  accept: () => Promise<boolean>;

  changeSheetOpen: boolean;
  openChangeSheet: () => void;
  closeChangeSheet: () => void;
  changeNote: string;
  setChangeNote: (v: string) => void;
  submittingChange: boolean;
  submitChangeRequest: () => Promise<boolean>;

  requoting: boolean;
  requestNewQuote: () => Promise<string | null>;

  reload: () => Promise<void>;
}

/**
 * Owns exactly one customer-facing quotation view. This hook only ever
 * calls `getQuotationForCustomer` — never `getQuotation` — so margin and
 * cost-breakdown data structurally never enters this screen's state, not
 * just stays unrendered.
 */
export function useQuotationPreview(): QuotationPreviewState {
  const { quotationId } = useParams<{ quotationId: string }>();
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<QuotationPreviewStatus>('loading');
  const [view, setView] = useState<CustomerQuotationView | null>(null);

  const [accepting, setAccepting] = useState(false);
  const [changeSheetOpen, setChangeSheetOpen] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [submittingChange, setSubmittingChange] = useState(false);
  const [requoting, setRequoting] = useState(false);

  const load = useCallback(async () => {
    if (!quotationId) {
      setStatus('error');
      return;
    }
    try {
      const first = await repository.getQuotationForCustomer(quotationId);
      if (!first) {
        setStatus('error');
        return;
      }
      // Opening this screen while a quote is still "sent" is itself the
      // view event — the same signal a real customer-portal link would send.
      if (first.effectiveStatus === 'sent') {
        await repository.recordQuotationView(quotationId);
        const refreshed = await repository.getQuotationForCustomer(quotationId);
        setView(refreshed);
      } else {
        setView(first);
      }
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, quotationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const accept = useCallback(async () => {
    if (!quotationId) return false;
    setAccepting(true);
    try {
      await repository.acceptQuotation(quotationId);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setAccepting(false);
    }
  }, [repository, quotationId, load]);

  const openChangeSheet = useCallback(() => {
    setChangeNote('');
    setChangeSheetOpen(true);
  }, []);
  const closeChangeSheet = useCallback(() => setChangeSheetOpen(false), []);

  const submitChangeRequest = useCallback(async () => {
    if (!quotationId || !changeNote.trim()) return false;
    setSubmittingChange(true);
    try {
      await repository.requestQuotationChanges(quotationId, changeNote.trim());
      await load();
      setChangeSheetOpen(false);
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingChange(false);
    }
  }, [repository, quotationId, changeNote, load]);

  const requestNewQuote = useCallback(async () => {
    if (!quotationId) return null;
    setRequoting(true);
    try {
      const updated = await repository.createQuotationVersion(
        quotationId,
        {},
        { key: 'quotation.reason.expiredRequote' },
        user?.name ?? 'Sales',
      );
      return updated.id;
    } catch {
      return null;
    } finally {
      setRequoting(false);
    }
  }, [repository, quotationId, user]);

  return {
    status,
    view,
    accepting,
    accept,
    changeSheetOpen,
    openChangeSheet,
    closeChangeSheet,
    changeNote,
    setChangeNote,
    submittingChange,
    submitChangeRequest,
    requoting,
    requestNewQuote,
    reload: load,
  };
}
