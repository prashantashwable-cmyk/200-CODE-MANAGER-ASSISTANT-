import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DiscountRequest, DiscountRequestStatus, PricingConfig, Quotation, User } from '@/data/types';
import type { DiscountApprovalStatus } from './discount-approval.types';

interface RequestForm {
  quotationId: string;
  discountPct: string;
  reasonNote: string;
  urgent: boolean;
}

const EMPTY_FORM: RequestForm = { quotationId: '', discountPct: '', reasonNote: '', urgent: false };

/** Mirrors the repository's own `requestDiscount` formula exactly, so the
 *  live preview shown before submitting never disagrees with what the
 *  server actually records. */
function previewMargin(quotation: Quotation, discountPct: number): number {
  const baseCost = quotation.cost.equipmentCost + quotation.cost.civilWorkEstimate + quotation.cost.installationLaborCost + quotation.cost.transportCost;
  const sellBeforeTax = quotation.cost.finalPrice / (1 + quotation.cost.gstPercent / 100);
  const discountedSell = sellBeforeTax * (1 - discountPct / 100);
  return discountedSell > 0 ? Math.round(((discountedSell - baseCost) / discountedSell) * 1000) / 10 : 0;
}

interface DiscountApprovalState {
  status: DiscountApprovalStatus;
  eligibleQuotations: Quotation[];
  requests: DiscountRequest[];
  pricingConfig: PricingConfig | null;

  form: RequestForm;
  setForm: (patch: Partial<RequestForm>) => void;
  marginPreview: number | null;
  submitting: boolean;
  submitRequest: () => Promise<{ ok: boolean; autoApproved: boolean }>;

  statusFilter: DiscountRequestStatus | 'all';
  setStatusFilter: (status: DiscountRequestStatus | 'all') => void;
  filteredRequests: DiscountRequest[];

  deciding: string | null;
  approve: (id: string) => Promise<boolean>;
  reject: (id: string, rejectionReason: string, counterSuggestionPct?: number) => Promise<boolean>;

  nameOf: (userId: string) => string;
  quotationLabel: (quotationId: string) => string;
  quotationOf: (quotationId: string) => Quotation | undefined;

  reload: () => Promise<void>;
}

export function useDiscountApproval(): DiscountApprovalState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<DiscountApprovalStatus>('loading');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [requests, setRequests] = useState<DiscountRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);

  const [form, setFormState] = useState<RequestForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DiscountRequestStatus | 'all'>('all');
  const [deciding, setDeciding] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [quotationList, requestList, userList, pricing] = await Promise.all([
        repository.listQuotations(),
        repository.listDiscountRequests(),
        repository.listUsers(),
        repository.getPricingConfig(),
      ]);
      setQuotations(quotationList);
      setRequests(requestList);
      setUsers(userList);
      setPricingConfig(pricing);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const eligibleQuotations = useMemo(
    () => quotations.filter((q) => q.status !== 'superseded' && q.status !== 'accepted').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [quotations],
  );

  const setForm = useCallback((patch: Partial<RequestForm>) => setFormState((prev) => ({ ...prev, ...patch })), []);

  const selectedQuotation = quotations.find((q) => q.id === form.quotationId);
  const discountPctNumber = Number(form.discountPct);
  const marginPreview = selectedQuotation && form.discountPct && !Number.isNaN(discountPctNumber) ? previewMargin(selectedQuotation, discountPctNumber) : null;

  const submitRequest = useCallback(async () => {
    if (!selectedQuotation || !user || Number.isNaN(discountPctNumber)) return { ok: false, autoApproved: false };
    setSubmitting(true);
    try {
      const created = await repository.requestDiscount({
        quotationId: selectedQuotation.id,
        requestedByUserId: user.id,
        requestedDiscountPct: discountPctNumber,
        reasonNote: form.reasonNote,
        urgent: form.urgent,
      });
      setFormState(EMPTY_FORM);
      await load();
      return { ok: true, autoApproved: created.status === 'approved' };
    } catch {
      return { ok: false, autoApproved: false };
    } finally {
      setSubmitting(false);
    }
  }, [repository, selectedQuotation, user, discountPctNumber, form.reasonNote, form.urgent, load]);

  const filteredRequests = useMemo(() => {
    const list = requests.filter((r) => statusFilter === 'all' || r.status === statusFilter);
    return [...list].sort((a, b) => {
      const aPendingUrgent = a.status === 'pending' && a.urgent ? 1 : 0;
      const bPendingUrgent = b.status === 'pending' && b.urgent ? 1 : 0;
      if (aPendingUrgent !== bPendingUrgent) return bPendingUrgent - aPendingUrgent;
      const aPending = a.status === 'pending' ? 1 : 0;
      const bPending = b.status === 'pending' ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [requests, statusFilter]);

  const approve = useCallback(
    async (id: string) => {
      if (!user) return false;
      setDeciding(id);
      try {
        await repository.decideDiscountRequest(id, { status: 'approved', approverId: user.id });
        await load();
        return true;
      } catch {
        return false;
      } finally {
        setDeciding(null);
      }
    },
    [repository, user, load],
  );

  const reject = useCallback(
    async (id: string, rejectionReason: string, counterSuggestionPct?: number) => {
      if (!user) return false;
      setDeciding(id);
      try {
        await repository.decideDiscountRequest(id, { status: 'rejected', approverId: user.id, rejectionReason, counterSuggestionPct });
        await load();
        return true;
      } catch {
        return false;
      } finally {
        setDeciding(null);
      }
    },
    [repository, user, load],
  );

  const nameOf = useCallback(
    (userId: string) => (userId === 'system-auto' ? 'Automation' : (users.find((u) => u.id === userId)?.name ?? userId)),
    [users],
  );

  const quotationOf = useCallback((quotationId: string) => quotations.find((q) => q.id === quotationId), [quotations]);
  const quotationLabel = useCallback((quotationId: string) => quotationOf(quotationId)?.code ?? quotationId, [quotationOf]);

  return {
    status,
    eligibleQuotations,
    requests,
    pricingConfig,
    form,
    setForm,
    marginPreview,
    submitting,
    submitRequest,
    statusFilter,
    setStatusFilter,
    filteredRequests,
    deciding,
    approve,
    reject,
    nameOf,
    quotationLabel,
    quotationOf,
    reload: load,
  };
}
