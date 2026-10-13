import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { InvoiceDealView } from '@/data/repository';
import type { InvoiceGeneratorStatus } from './invoice-generator.types';

interface InvoiceGeneratorState {
  status: InvoiceGeneratorStatus;
  view: InvoiceDealView | null;
  isAdmin: boolean;

  generatingFinal: boolean;
  generateFinal: () => Promise<boolean>;

  gstinDraft: string;
  setGstinDraft: (v: string) => void;
  savingGstin: boolean;
  saveGstin: () => Promise<boolean>;

  selectedInvoiceId: string | null;
  openInvoice: (id: string) => void;
  closeInvoice: () => void;

  creditNoteOpen: boolean;
  openCreditNote: () => void;
  closeCreditNote: () => void;
  creditAmount: number | '';
  setCreditAmount: (n: number | '') => void;
  creditReason: string;
  setCreditReason: (v: string) => void;
  submittingCredit: boolean;
  submitCreditNote: () => Promise<boolean>;

  reissueOpen: boolean;
  openReissue: () => void;
  closeReissue: () => void;
  reissueReason: string;
  setReissueReason: (v: string) => void;
  submittingReissue: boolean;
  submitReissue: () => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * One deal's invoices, shared by Admin and the owning customer — the view
 * itself already backfills any missing per-stage invoice on read (see
 * `getInvoicesForDeal`'s own comment), so this hook never has to trigger
 * generation itself. The admin-only actions (final invoice, credit note,
 * reissue, GSTIN) are exposed unconditionally; the screen gates them on
 * `isAdmin` since only Admin ever sees the buttons that call them.
 */
export function useInvoiceGenerator(): InvoiceGeneratorState {
  const { dealId } = useParams<{ dealId: string }>();
  const repository = useData();
  const { user } = useSession();
  const isAdmin = user?.role === 'admin';

  const [status, setStatus] = useState<InvoiceGeneratorStatus>('loading');
  const [view, setView] = useState<InvoiceDealView | null>(null);
  const [generatingFinal, setGeneratingFinal] = useState(false);
  const [gstinDraft, setGstinDraft] = useState('');
  const [savingGstin, setSavingGstin] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [creditNoteOpen, setCreditNoteOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number | ''>('');
  const [creditReason, setCreditReason] = useState('');
  const [submittingCredit, setSubmittingCredit] = useState(false);
  const [reissueOpen, setReissueOpen] = useState(false);
  const [reissueReason, setReissueReason] = useState('');
  const [submittingReissue, setSubmittingReissue] = useState(false);

  const load = useCallback(async () => {
    if (!dealId || !user) return;
    try {
      const result = await repository.getInvoicesForDeal(dealId, { role: user.role, id: user.id });
      if (!result) {
        setStatus('not_found');
        return;
      }
      setView(result);
      setGstinDraft((cur) => cur || result.customerGstin || '');
      setStatus('ready');
    } catch {
      setStatus((cur) => (cur === 'ready' ? cur : 'error'));
    }
  }, [dealId, user, repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const generateFinal = useCallback(async () => {
    if (!dealId || !user) return false;
    setGeneratingFinal(true);
    try {
      await repository.generateFinalInvoice(dealId, user.name);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setGeneratingFinal(false);
    }
  }, [dealId, user, repository, load]);

  const saveGstin = useCallback(async () => {
    if (!dealId || !gstinDraft.trim()) return false;
    setSavingGstin(true);
    try {
      await repository.setDealCustomerGstin(dealId, gstinDraft.trim());
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSavingGstin(false);
    }
  }, [dealId, gstinDraft, repository, load]);

  const openInvoice = useCallback((id: string) => setSelectedInvoiceId(id), []);
  const closeInvoice = useCallback(() => {
    setSelectedInvoiceId(null);
    setCreditNoteOpen(false);
    setReissueOpen(false);
  }, []);

  const openCreditNote = useCallback(() => {
    const inv = view?.invoices.find((l) => l.invoice.id === selectedInvoiceId)?.invoice;
    setCreditAmount(inv?.totalAmount ?? '');
    setCreditReason('');
    setCreditNoteOpen(true);
  }, [view, selectedInvoiceId]);
  const closeCreditNote = useCallback(() => setCreditNoteOpen(false), []);

  const submitCreditNote = useCallback(async () => {
    if (!selectedInvoiceId || !user || !creditReason.trim() || creditAmount === '' || creditAmount <= 0) return false;
    setSubmittingCredit(true);
    try {
      await repository.issueCreditNote(selectedInvoiceId, creditAmount, creditReason.trim(), user.name);
      setCreditNoteOpen(false);
      setSelectedInvoiceId(null);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingCredit(false);
    }
  }, [selectedInvoiceId, user, creditAmount, creditReason, repository, load]);

  const openReissue = useCallback(() => {
    setReissueReason('');
    setReissueOpen(true);
  }, []);
  const closeReissue = useCallback(() => setReissueOpen(false), []);

  const submitReissue = useCallback(async () => {
    if (!selectedInvoiceId || !user || !reissueReason.trim()) return false;
    setSubmittingReissue(true);
    try {
      await repository.reissueInvoice(selectedInvoiceId, reissueReason.trim(), user.name);
      setReissueOpen(false);
      setSelectedInvoiceId(null);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingReissue(false);
    }
  }, [selectedInvoiceId, user, reissueReason, repository, load]);

  return {
    status,
    view,
    isAdmin,
    generatingFinal,
    generateFinal,
    gstinDraft,
    setGstinDraft,
    savingGstin,
    saveGstin,
    selectedInvoiceId,
    openInvoice,
    closeInvoice,
    creditNoteOpen,
    openCreditNote,
    closeCreditNote,
    creditAmount,
    setCreditAmount,
    creditReason,
    setCreditReason,
    submittingCredit,
    submitCreditNote,
    reissueOpen,
    openReissue,
    closeReissue,
    reissueReason,
    setReissueReason,
    submittingReissue,
    submitReissue,
    reload: load,
  };
}
