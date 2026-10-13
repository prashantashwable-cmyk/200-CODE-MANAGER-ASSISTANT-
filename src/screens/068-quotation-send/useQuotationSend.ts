import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import type { Lead, Quotation, QuotationDeliveryChannel } from '@/data/types';
import { ALL_CHANNELS, type QuotationSendStatus } from './quotation-send.types';

interface QuotationSendState {
  status: QuotationSendStatus;
  quotation: Quotation | null;
  lead: Lead | null;

  /** Channels this send may actually use — excludes an opted-out WhatsApp
   *  number and excludes email when the lead has none on file. */
  availableChannels: QuotationDeliveryChannel[];
  whatsappOptedOut: boolean;
  hasEmail: boolean;

  /** True once the quote has a version that superseded it — the send form
   *  is never shown for a stale version. */
  isSuperseded: boolean;
  /** True while a scheduled send hasn't fired yet. */
  hasPendingScheduledSend: boolean;
  /** True once a send (immediate or fired-scheduled) has actually gone out. */
  isSent: boolean;
  /** Set only when `isSuperseded` — the id of the current, live version. */
  latestVersionId: string | null;

  selectedChannels: QuotationDeliveryChannel[];
  toggleChannel: (channel: QuotationDeliveryChannel) => void;
  coverMessage: string;
  setCoverMessage: (v: string) => void;
  scheduleEnabled: boolean;
  setScheduleEnabled: (v: boolean) => void;
  scheduledSendAt: string;
  setScheduledSendAt: (v: string) => void;
  scheduleInPast: boolean;
  canSubmit: boolean;

  sending: boolean;
  submitSend: () => Promise<boolean>;

  cancelling: boolean;
  cancelScheduled: () => Promise<boolean>;

  reload: () => Promise<void>;
}

/**
 * Owns exactly one quotation's send/delivery lifecycle: the compose form
 * before it's sent, the pending-scheduled card while a future send waits,
 * and the delivery-confirmation summary once it has actually gone out —
 * one screen for the whole life of a send, per the spec's requirement that
 * delivery confirmation stays linked to the same place the send happened.
 */
export function useQuotationSend(): QuotationSendState {
  const { quotationId } = useParams<{ quotationId: string }>();
  const repository = useData();
  const [status, setStatus] = useState<QuotationSendStatus>('loading');
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [whatsappOptedOut, setWhatsappOptedOut] = useState(false);
  const [latestVersionId, setLatestVersionId] = useState<string | null>(null);

  const [selectedChannels, setSelectedChannels] = useState<QuotationDeliveryChannel[]>([]);
  const [coverMessage, setCoverMessage] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledSendAt, setScheduledSendAt] = useState('');
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!quotationId) {
      setStatus('error');
      return;
    }
    try {
      const q = await repository.getQuotation(quotationId);
      if (!q) {
        setStatus('error');
        return;
      }
      const leadResult = await repository.getLead(q.leadId);
      const optedOut = leadResult ? await repository.isOptedOut(leadResult.contactPhone, 'whatsapp') : true;
      let latestId: string | null = null;
      if (q.status === 'superseded') {
        const chain = await repository.listQuotationVersions(q.id);
        latestId = chain.length > 0 ? chain[chain.length - 1].id : null;
      }
      setQuotation(q);
      setLead(leadResult);
      setWhatsappOptedOut(optedOut);
      setLatestVersionId(latestId);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository, quotationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasEmail = Boolean(lead?.contactEmail);
  const availableChannels = useMemo(
    () => ALL_CHANNELS.filter((c) => (c === 'whatsapp' ? !whatsappOptedOut : hasEmail)),
    [whatsappOptedOut, hasEmail],
  );

  const isSuperseded = quotation?.status === 'superseded';
  const hasPendingScheduledSend = Boolean(quotation?.scheduledSendAt) && !quotation?.sentAt;
  const isSent = Boolean(quotation?.sentAt);

  // Defaults the channel picker to every channel actually available, exactly
  // once per loaded quotation — never fighting the user's own edits afterward.
  const [defaultedForId, setDefaultedForId] = useState<string | null>(null);
  useEffect(() => {
    if (quotation && !isSuperseded && !hasPendingScheduledSend && !isSent && defaultedForId !== quotation.id) {
      setSelectedChannels(availableChannels);
      setDefaultedForId(quotation.id);
    }
  }, [quotation, isSuperseded, hasPendingScheduledSend, isSent, availableChannels, defaultedForId]);

  const toggleChannel = useCallback((channel: QuotationDeliveryChannel) => {
    setSelectedChannels((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]));
  }, []);

  const scheduleInPast = scheduleEnabled && scheduledSendAt !== '' && new Date(scheduledSendAt).getTime() <= Date.now();
  const canSubmit =
    selectedChannels.length > 0 &&
    coverMessage.trim() !== '' &&
    (!scheduleEnabled || (scheduledSendAt !== '' && !scheduleInPast));

  const submitSend = useCallback(async () => {
    if (!quotation || !canSubmit) return false;
    setSending(true);
    try {
      await repository.sendQuotation(quotation.id, {
        channels: selectedChannels,
        coverMessage: coverMessage.trim(),
        scheduledSendAt: scheduleEnabled ? scheduledSendAt : undefined,
      });
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSending(false);
    }
  }, [repository, quotation, canSubmit, selectedChannels, coverMessage, scheduleEnabled, scheduledSendAt, load]);

  const cancelScheduled = useCallback(async () => {
    if (!quotation) return false;
    setCancelling(true);
    try {
      await repository.cancelScheduledQuotationSend(quotation.id);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setCancelling(false);
    }
  }, [repository, quotation, load]);

  return {
    status,
    quotation,
    lead,
    availableChannels,
    whatsappOptedOut,
    hasEmail,
    isSuperseded,
    hasPendingScheduledSend,
    isSent,
    latestVersionId,
    selectedChannels,
    toggleChannel,
    coverMessage,
    setCoverMessage,
    scheduleEnabled,
    setScheduleEnabled,
    scheduledSendAt,
    setScheduledSendAt,
    scheduleInPast,
    canSubmit,
    sending,
    submitSend,
    cancelling,
    cancelScheduled,
    reload: load,
  };
}
