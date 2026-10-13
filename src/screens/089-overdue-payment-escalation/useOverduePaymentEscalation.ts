import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CallOutcome } from '@/data/types';
import type { EscalationTier, OverdueEscalationRow } from '@/data/repository';
import type { OverduePaymentEscalationStatus } from './overdue-payment-escalation.types';

interface OverduePaymentEscalationState {
  status: OverduePaymentEscalationStatus;
  rows: OverdueEscalationRow[];
  tierFilter: EscalationTier | null;
  setTierFilter: (t: EscalationTier | null) => void;

  openRow: OverdueEscalationRow | null;
  openDetail: (row: OverdueEscalationRow) => void;
  closeDetail: () => void;

  sendingNotice: boolean;
  sendNotice: () => Promise<boolean>;

  callSheetOpen: boolean;
  openCallSheet: () => void;
  closeCallSheet: () => void;
  callOutcome: CallOutcome | '';
  setCallOutcome: (o: CallOutcome | '') => void;
  callDuration: number;
  setCallDuration: (d: number) => void;
  callConsent: boolean;
  setCallConsent: (c: boolean) => void;
  submittingCall: boolean;
  submitCall: () => Promise<boolean>;

  holdSheetOpen: boolean;
  openHoldSheet: () => void;
  closeHoldSheet: () => void;
  holdReason: string;
  setHoldReason: (r: string) => void;
  holdAcknowledged: boolean;
  setHoldAcknowledged: (v: boolean) => void;
  submittingHold: boolean;
  submitHold: () => Promise<boolean>;

  reload: () => Promise<void>;
}

export function useOverduePaymentEscalation(): OverduePaymentEscalationState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<OverduePaymentEscalationStatus>('loading');
  const [allRows, setAllRows] = useState<OverdueEscalationRow[]>([]);
  const [tierFilter, setTierFilter] = useState<EscalationTier | null>(null);

  const [openPaymentId, setOpenPaymentId] = useState<string | null>(null);
  const [sendingNotice, setSendingNotice] = useState(false);

  const [callSheetOpen, setCallSheetOpen] = useState(false);
  const [callOutcome, setCallOutcome] = useState<CallOutcome | ''>('');
  const [callDuration, setCallDuration] = useState(0);
  const [callConsent, setCallConsent] = useState(false);
  const [submittingCall, setSubmittingCall] = useState(false);

  const [holdSheetOpen, setHoldSheetOpen] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [holdAcknowledged, setHoldAcknowledged] = useState(false);
  const [submittingHold, setSubmittingHold] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await repository.getOverdueEscalationQueue();
      setAllRows(list);
      setStatus('ready');
    } catch {
      setStatus((cur) => (cur === 'ready' ? cur : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => allRows.filter((r) => !tierFilter || r.tier === tierFilter), [allRows, tierFilter]);

  const openRow = useMemo(() => allRows.find((r) => r.payment.id === openPaymentId) ?? null, [allRows, openPaymentId]);

  const openDetail = useCallback((row: OverdueEscalationRow) => setOpenPaymentId(row.payment.id), []);
  const closeDetail = useCallback(() => {
    setOpenPaymentId(null);
    setCallSheetOpen(false);
    setHoldSheetOpen(false);
  }, []);

  const sendNotice = useCallback(async () => {
    if (!openRow || !user) return false;
    setSendingNotice(true);
    try {
      await repository.sendFormalPaymentNotice(openRow.payment.id, user.name);
      return true;
    } catch {
      return false;
    } finally {
      setSendingNotice(false);
    }
  }, [repository, openRow, user]);

  const openCallSheet = useCallback(() => {
    setCallOutcome('');
    setCallDuration(0);
    setCallConsent(false);
    setCallSheetOpen(true);
  }, []);
  const closeCallSheet = useCallback(() => setCallSheetOpen(false), []);

  const submitCall = useCallback(async () => {
    if (!openRow || !callOutcome) return false;
    setSubmittingCall(true);
    try {
      const call = await repository.logCall(openRow.leadId, 'manual');
      await repository.setCallDisposition(call.id, callOutcome, callDuration, callConsent);
      setCallSheetOpen(false);
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingCall(false);
    }
  }, [repository, openRow, callOutcome, callDuration, callConsent]);

  const openHoldSheet = useCallback(() => {
    setHoldReason('');
    setHoldAcknowledged(false);
    setHoldSheetOpen(true);
  }, []);
  const closeHoldSheet = useCallback(() => setHoldSheetOpen(false), []);

  const submitHold = useCallback(async () => {
    if (!openRow || !user || !holdReason.trim() || !holdAcknowledged) return false;
    setSubmittingHold(true);
    try {
      await repository.flagInstallationHold(openRow.dealId, holdReason.trim(), user.name);
      setHoldSheetOpen(false);
      setOpenPaymentId(null);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingHold(false);
    }
  }, [repository, openRow, user, holdReason, holdAcknowledged, load]);

  return {
    status,
    rows,
    tierFilter,
    setTierFilter,
    openRow,
    openDetail,
    closeDetail,
    sendingNotice,
    sendNotice,
    callSheetOpen,
    openCallSheet,
    closeCallSheet,
    callOutcome,
    setCallOutcome,
    callDuration,
    setCallDuration,
    callConsent,
    setCallConsent,
    submittingCall,
    submitCall,
    holdSheetOpen,
    openHoldSheet,
    closeHoldSheet,
    holdReason,
    setHoldReason,
    holdAcknowledged,
    setHoldAcknowledged,
    submittingHold,
    submitHold,
    reload: load,
  };
}
