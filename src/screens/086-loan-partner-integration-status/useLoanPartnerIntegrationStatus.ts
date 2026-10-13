import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { LoanApplicationAdminRow, LoanPartnerStat } from '@/data/repository';
import type { StatusFilter } from './loan-partner-integration-status.types';

interface LoanPartnerIntegrationStatusState {
  status: 'loading' | 'ready' | 'error';
  rows: LoanApplicationAdminRow[];
  filteredRows: LoanApplicationAdminRow[];
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  partnerStats: LoanPartnerStat[];
  stuckCount: number;

  selected: LoanApplicationAdminRow | null;
  openDetail: (row: LoanApplicationAdminRow) => void;
  closeDetail: () => void;

  escalating: boolean;
  escalate: (applicationId: string) => Promise<boolean>;

  cancelling: string;
  cancelReason: string;
  setCancelReason: (v: string) => void;
  startCancel: () => void;
  cancelPromptOpen: boolean;
  submitCancel: (applicationId: string) => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Every loan application across every customer/deal, Admin's reconciliation
 * backstop. On every load this idempotently raises an alert for any
 * application stuck `'approved'` past the reasonable window — the spec's
 * "not sit silently" edge case — rather than waiting for Admin to open the
 * detail sheet and click Escalate by hand; that button just confirms the
 * same alert already exists.
 */
export function useLoanPartnerIntegrationStatus(): LoanPartnerIntegrationStatusState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [rows, setRows] = useState<LoanApplicationAdminRow[]>([]);
  const [partnerStats, setPartnerStats] = useState<LoanPartnerStat[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<LoanApplicationAdminRow | null>(null);
  const [escalating, setEscalating] = useState(false);
  const [cancelling, setCancelling] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelPromptOpen, setCancelPromptOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [applications, stats] = await Promise.all([repository.listLoanApplicationsForAdmin(), repository.getLoanPartnerStats()]);
      setRows(applications);
      setPartnerStats(stats);
      setStatus('ready');
      await Promise.all(applications.filter((r) => r.isStuck).map((r) => repository.escalateLoanApplication(r.application.id).catch(() => null)));
    } catch {
      setStatus((cur) => (cur === 'ready' ? cur : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return rows;
    if (statusFilter === 'stuck') return rows.filter((r) => r.isStuck);
    return rows.filter((r) => r.application.status === statusFilter);
  }, [rows, statusFilter]);

  const stuckCount = useMemo(() => rows.filter((r) => r.isStuck).length, [rows]);

  const openDetail = useCallback((row: LoanApplicationAdminRow) => {
    setSelected(row);
    setCancelPromptOpen(false);
    setCancelReason('');
  }, []);
  const closeDetail = useCallback(() => {
    setSelected(null);
    setCancelPromptOpen(false);
    setCancelReason('');
  }, []);

  const escalate = useCallback(
    async (applicationId: string) => {
      setEscalating(true);
      try {
        await repository.escalateLoanApplication(applicationId);
        return true;
      } catch {
        return false;
      } finally {
        setEscalating(false);
      }
    },
    [repository],
  );

  const startCancel = useCallback(() => setCancelPromptOpen(true), []);

  const submitCancel = useCallback(
    async (applicationId: string) => {
      if (!user || !cancelReason.trim()) return false;
      setCancelling(applicationId);
      try {
        await repository.cancelLoanApplication(applicationId, cancelReason.trim(), user.name);
        setCancelPromptOpen(false);
        setCancelReason('');
        setSelected(null);
        await load();
        return true;
      } catch {
        return false;
      } finally {
        setCancelling('');
      }
    },
    [repository, user, cancelReason, load],
  );

  return {
    status,
    rows,
    filteredRows,
    statusFilter,
    setStatusFilter,
    partnerStats,
    stuckCount,
    selected,
    openDetail,
    closeDetail,
    escalating,
    escalate,
    cancelling,
    cancelReason,
    setCancelReason,
    startCancel,
    cancelPromptOpen,
    submitCancel,
    reload: load,
  };
}
