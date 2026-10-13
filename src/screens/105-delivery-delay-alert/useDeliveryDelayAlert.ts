import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DelayBoard, DelayRow, NotifyDelayResult } from '@/data/repository';
import type { DelayRootCause } from '@/data/types';
import type { DelayFilter, DeliveryDelayStatus } from './delivery-delay-alert.types';
import { POLL_MS } from './delivery-delay-alert.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
  notify?: NotifyDelayResult;
  threadId?: string;
  logged?: boolean;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export interface CauseDraft {
  cause: DelayRootCause | '';
  label: string;
  note: string;
}
export interface ContactDraft {
  channel: 'in_app' | 'phone' | 'email' | 'whatsapp' | 'in_person';
  body: string;
  expectsReply: boolean;
}

export function useDeliveryDelayAlert() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const caseParam = searchParams.get('case');

  const [status, setStatus] = useState<DeliveryDelayStatus>('loading');
  const [board, setBoard] = useState<DelayBoard | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBoard(await repository.getDelayBoard(user.id));
      setNow(Date.now());
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);
  const reload = () => {
    setStatus('loading');
    void load();
  };

  /* --------------------------------------------------------- filter + search */
  const [filter, setFilter] = useState<DelayFilter>('all');
  const [query, setQuery] = useState('');
  const open = useMemo(() => board?.open ?? [], [board]);
  const recovered = useMemo(() => board?.recovered ?? [], [board]);
  const counts = useMemo(
    () => ({
      all: open.length,
      critical: open.filter((r) => r.severity === 'critical').length,
      late: open.filter((r) => r.severity === 'late').length,
      watch: open.filter((r) => r.severity === 'watch').length,
      untold: open.filter((r) => !r.customerNotifiedAt || r.notifyStale).length,
    }),
    [open],
  );
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return open
      .filter((r) => (filter === 'all' ? true : filter === 'untold' ? !r.customerNotifiedAt || r.notifyStale : r.severity === filter))
      .filter((r) => !q || [r.poCode, r.siteName, r.supplierName, r.customerName].some((v) => v.toLowerCase().includes(q)));
  }, [open, filter, query]);

  /* ------------------------------------------------------------ selection */
  const [batchSheet, setBatchSheet] = useState<'tag' | 'tell' | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const toggleSelecting = () => {
    setSelecting((on) => !on);
    setSelected([]);
  };
  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  // Only what is still on screen stays selected.
  const chosen = useMemo(() => open.filter((r) => selected.includes(r.caseId)), [open, selected]);

  /* ------------------------------------------------------------- the sheet */
  const openRow: DelayRow | null = useMemo(() => [...open, ...recovered].find((r) => r.caseId === caseParam) ?? null, [open, recovered, caseParam]);
  const openCase = (id: string) => setSearchParams({ case: id });
  const closeCase = () => setSearchParams({});

  /* ------------------------------------------------------------ root cause */
  const [causeDraft, setCauseDraft] = useState<Record<string, CauseDraft>>({});
  const causeOf = (row: DelayRow): CauseDraft => causeDraft[row.caseId] ?? { cause: row.rootCause ?? '', label: row.externalLabel ?? '', note: row.rootCauseNote ?? '' };
  const patchCause = (row: DelayRow, patch: Partial<CauseDraft>) => setCauseDraft((cur) => ({ ...cur, [row.caseId]: { ...causeOf(row), ...patch } }));
  const canTag = (d: CauseDraft) => d.cause !== '' && (d.cause !== 'external_event' || d.label.trim().length >= 3);

  const tagCauses = async (rows: DelayRow[], d: CauseDraft): Promise<ActionResult> => {
    if (!user || !d.cause || !canTag(d)) return { ok: false, code: 'label_required' };
    setBusy(true);
    try {
      await repository.tagDelayCause(rows.map((r) => r.caseId), { cause: d.cause, note: d.note || undefined, externalLabel: d.cause === 'external_event' ? d.label.trim() : undefined }, user.id);
      await load();
      return { ok: true };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------------------- the supplier */
  const [contactDraft, setContactDraft] = useState<Record<string, ContactDraft>>({});
  const contactOf = (row: DelayRow, template: string): ContactDraft =>
    contactDraft[row.caseId] ?? { channel: row.supplierHasLogin ? 'in_app' : 'phone', body: template, expectsReply: true };
  const patchContact = (row: DelayRow, template: string, patch: Partial<ContactDraft>) => setContactDraft((cur) => ({ ...cur, [row.caseId]: { ...contactOf(row, template), ...patch } }));

  const contactSupplier = async (row: DelayRow, d: ContactDraft): Promise<ActionResult> => {
    if (!user) return { ok: false, code: 'forbidden' };
    setBusy(true);
    try {
      const { threadId } = await repository.contactSupplierAboutDelay(row.caseId, { channel: d.channel, body: d.body, expectsReply: d.expectsReply }, user.id);
      await load();
      return { ok: true, threadId, logged: d.channel !== 'in_app' };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------------------- the customer */
  const tellCustomers = async (rows: DelayRow[]): Promise<ActionResult> => {
    if (!user) return { ok: false, code: 'forbidden' };
    setBusy(true);
    try {
      const notify = await repository.notifyDelayCustomers(rows.map((r) => r.caseId), user.id);
      await load();
      return { ok: true, notify };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------------------- escalation */
  const [escalateNote, setEscalateNote] = useState('');
  const escalate = async (row: DelayRow): Promise<ActionResult> => {
    if (!user) return { ok: false, code: 'forbidden' };
    setBusy(true);
    try {
      await repository.escalateDelay(row.caseId, escalateNote, user.id);
      setEscalateNote('');
      await load();
      return { ok: true };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  return {
    status,
    board,
    reload,
    busy,
    now,
    // list
    open,
    recovered,
    shown,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    // selection
    selecting,
    toggleSelecting,
    selected,
    toggle,
    chosen,
    clearSelection: () => setSelected([]),
    batchSheet,
    setBatchSheet,
    // sheet
    caseParam,
    openRow,
    openCase,
    closeCase,
    // actions
    causeOf,
    patchCause,
    canTag,
    tagCauses,
    contactOf,
    patchContact,
    contactSupplier,
    tellCustomers,
    escalateNote,
    setEscalateNote,
    escalate,
  };
}

export type DeliveryDelayState = ReturnType<typeof useDeliveryDelayAlert>;
