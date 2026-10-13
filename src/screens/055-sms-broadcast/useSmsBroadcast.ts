import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { BroadcastSegmentPreview } from '@/data/repository';
import type { Lead, LeadSource, LeadStage, SmsBroadcast } from '@/data/types';
import type { SmsBroadcastStatus } from './sms-broadcast.types';
import { LARGE_SEND_THRESHOLD, RESTRICTED_HOUR_END, RESTRICTED_HOUR_START } from './sms-broadcast.types';

interface ComposeFilter {
  stages: LeadStage[];
  sources: LeadSource[];
  city: string;
  query: string;
}

const EMPTY_FILTER: ComposeFilter = { stages: [], sources: [], city: '', query: '' };

interface SmsBroadcastState {
  status: SmsBroadcastStatus;
  broadcasts: SmsBroadcast[];
  cities: string[];
  kpi: { sentThisMonth: number; deliveryRatePct: number | null; totalCost: number };

  composeOpen: boolean;
  openCompose: () => void;
  closeCompose: () => void;

  name: string;
  setName: (v: string) => void;
  messageBody: string;
  setMessageBody: (v: string) => void;
  filter: ComposeFilter;
  toggleStage: (stage: LeadStage) => void;
  toggleSource: (source: LeadSource) => void;
  setCity: (city: string) => void;
  setQuery: (query: string) => void;
  scheduledFor: string;
  setScheduledFor: (v: string) => void;
  largeSendConfirmed: boolean;
  setLargeSendConfirmed: (v: boolean) => void;

  preview: BroadcastSegmentPreview | null;
  isLargeSend: boolean;
  isRestrictedHour: boolean;
  canSend: boolean;

  send: (segmentDescription: string) => Promise<boolean>;
  cancel: (id: string) => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * Owns the broadcast list plus the compose flow. The segment builder reuses
 * the same stage/source/city filters as the Lead Inbox — `previewBroadcastSegment`
 * is the single source of truth for who's eligible, so the cost estimate and
 * the actual send always agree on the same excluded-opt-out count.
 */
export function useSmsBroadcast(): SmsBroadcastState {
  const repository = useData();
  const [status, setStatus] = useState<SmsBroadcastStatus>('loading');
  const [broadcasts, setBroadcasts] = useState<SmsBroadcast[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [composeOpen, setComposeOpen] = useState(false);
  const [name, setName] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [filter, setFilter] = useState<ComposeFilter>(EMPTY_FILTER);
  const [scheduledFor, setScheduledFor] = useState('');
  const [largeSendConfirmed, setLargeSendConfirmed] = useState(false);
  const [preview, setPreview] = useState<BroadcastSegmentPreview | null>(null);

  const load = useCallback(async () => {
    try {
      const [broadcastList, leadList] = await Promise.all([repository.listBroadcasts(), repository.listLeads({ sort: 'recent' })]);
      setBroadcasts(broadcastList);
      setLeads(leadList);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const cities = useMemo(() => [...new Set(leads.map((l) => l.city))].sort(), [leads]);

  const previewRequestId = useRef(0);
  useEffect(() => {
    const requestId = (previewRequestId.current += 1);
    repository
      .previewBroadcastSegment({
        stage: filter.stages.length ? filter.stages : undefined,
        source: filter.sources.length ? filter.sources : undefined,
        city: filter.city || undefined,
        query: filter.query || undefined,
      })
      .then((result) => {
        if (previewRequestId.current === requestId) setPreview(result);
      })
      .catch(() => {
        if (previewRequestId.current === requestId) setPreview(null);
      });
  }, [repository, filter]);

  const toggleStage = useCallback((stage: LeadStage) => {
    setFilter((f) => ({ ...f, stages: f.stages.includes(stage) ? f.stages.filter((s) => s !== stage) : [...f.stages, stage] }));
    setLargeSendConfirmed(false);
  }, []);

  const toggleSource = useCallback((source: LeadSource) => {
    setFilter((f) => ({ ...f, sources: f.sources.includes(source) ? f.sources.filter((s) => s !== source) : [...f.sources, source] }));
    setLargeSendConfirmed(false);
  }, []);

  const setCity = useCallback((city: string) => {
    setFilter((f) => ({ ...f, city }));
    setLargeSendConfirmed(false);
  }, []);

  const setQuery = useCallback((query: string) => {
    setFilter((f) => ({ ...f, query }));
    setLargeSendConfirmed(false);
  }, []);

  const isLargeSend = (preview?.leadIds.length ?? 0) > LARGE_SEND_THRESHOLD;

  const isRestrictedHour = useMemo(() => {
    if (!scheduledFor) return false;
    const hour = new Date(scheduledFor).getHours();
    if (Number.isNaN(hour)) return false;
    return hour >= RESTRICTED_HOUR_START || hour < RESTRICTED_HOUR_END;
  }, [scheduledFor]);

  const canSend =
    !!preview &&
    preview.leadIds.length > 0 &&
    name.trim().length > 0 &&
    messageBody.trim().length > 0 &&
    !isRestrictedHour &&
    (!isLargeSend || largeSendConfirmed);

  const openCompose = useCallback(() => {
    setName('');
    setMessageBody('');
    setFilter(EMPTY_FILTER);
    setScheduledFor('');
    setLargeSendConfirmed(false);
    setComposeOpen(true);
  }, []);

  const closeCompose = useCallback(() => setComposeOpen(false), []);

  const send = useCallback(
    async (segmentDescription: string) => {
      if (!preview || !canSend) return false;
      try {
        await repository.createBroadcast({
          name: name.trim(),
          segmentDescription,
          leadIds: preview.leadIds,
          messageBody: messageBody.trim(),
          scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
        });
        await load();
        setComposeOpen(false);
        return true;
      } catch {
        return false;
      }
    },
    [repository, preview, canSend, name, messageBody, scheduledFor, load],
  );

  const cancel = useCallback(
    async (id: string) => {
      try {
        await repository.cancelBroadcast(id);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, load],
  );

  const kpi = useMemo(() => {
    const monthAgo = Date.now() - 30 * 86_400_000;
    const recent = broadcasts.filter((b) => new Date(b.createdAt).getTime() >= monthAgo && b.sentCount > 0);
    const sentThisMonth = recent.reduce((sum, b) => sum + b.sentCount, 0);
    const deliveredTotal = recent.reduce((sum, b) => sum + b.deliveredCount, 0);
    const totalCost = recent.reduce((sum, b) => sum + (b.actualCost ?? 0), 0);
    return {
      sentThisMonth,
      deliveryRatePct: sentThisMonth > 0 ? Math.round((deliveredTotal / sentThisMonth) * 100) : null,
      totalCost,
    };
  }, [broadcasts]);

  return {
    status,
    broadcasts,
    cities,
    kpi,
    composeOpen,
    openCompose,
    closeCompose,
    name,
    setName,
    messageBody,
    setMessageBody,
    filter,
    toggleStage,
    toggleSource,
    setCity,
    setQuery,
    scheduledFor,
    setScheduledFor,
    largeSendConfirmed,
    setLargeSendConfirmed,
    preview,
    isLargeSend,
    isRestrictedHour,
    canSend,
    send,
    cancel,
    reload: load,
  };
}
