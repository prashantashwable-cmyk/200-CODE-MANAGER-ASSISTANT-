import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { BookablePo, BookPartnerResult, PartnerBoard, PartnerRow } from '@/data/repository';
import type { CauseFilter, PartnerFilter, PartnerMgmtStatus, PartnerTab } from './delivery-partner-management.types';
import { PARTNER_TABS, POLL_MS } from './delivery-partner-management.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
  booked?: BookPartnerResult;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

export interface PartnerDraft {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  serviceAreas: string[];
  liveTrackingSupported: boolean;
  rateCardRef: string;
}
export interface LaneDraft {
  originCity: string;
  destinationCity: string;
  distanceKm: string;
  ratePerTrip: string;
  transitDays: string;
}
export interface BookDraft {
  lineIds: string[];
  partnerId: string;
  vehicleLabel: string;
  driverName: string;
  driverPhone: string;
}

const emptyPartner: PartnerDraft = { name: '', contactName: '', phone: '', email: '', serviceAreas: [], liveTrackingSupported: false, rateCardRef: '' };
const emptyLane: LaneDraft = { originCity: '', destinationCity: '', distanceKm: '', ratePerTrip: '', transitDays: '1' };

export type PartnerMgmtState = ReturnType<typeof useDeliveryPartnerManagement>;

export function useDeliveryPartnerManagement() {
  const repository = useData();
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: PartnerTab = PARTNER_TABS.includes(tabParam as PartnerTab) ? (tabParam as PartnerTab) : 'partners';
  const partnerParam = searchParams.get('partner');
  const poParam = searchParams.get('poId');

  const [status, setStatus] = useState<PartnerMgmtStatus>('loading');
  const [board, setBoard] = useState<PartnerBoard | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBoard(await repository.getPartnerBoard(user.id));
      setStatus('ready');
    } catch {
      // A failed refresh never blanks a board that is already showing.
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

  const setTab = (next: PartnerTab) => setSearchParams(next === 'partners' ? {} : { tab: next }, { replace: true });
  const openPartner = (id: string) => setSearchParams({ partner: id });
  const closePartner = () => setSearchParams({});

  const partners = useMemo(() => board?.partners ?? [], [board]);
  const current: PartnerRow | null = useMemo(() => partners.find((p) => p.id === partnerParam) ?? null, [partners, partnerParam]);

  const run = async (fn: () => Promise<ActionResult | void>): Promise<ActionResult> => {
    setBusy(true);
    try {
      const out = (await fn()) ?? { ok: true };
      await load();
      return out;
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* --------------------------------------------------------------- the list */
  const [filter, setFilter] = useState<PartnerFilter>('all');
  const [query, setQuery] = useState('');
  const counts = useMemo(
    () => ({
      all: partners.length,
      live: partners.filter((p) => p.liveTrackingSupported).length,
      milestone: partners.filter((p) => !p.liveTrackingSupported).length,
      attention: partners.filter((p) => p.feedStatus === 'outage').length,
      new: partners.filter((p) => !p.stats.rated).length,
      paused: partners.filter((p) => p.status === 'paused').length,
    }),
    [partners],
  );
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return partners
      .filter((p) => {
        if (filter === 'live') return p.liveTrackingSupported;
        if (filter === 'milestone') return !p.liveTrackingSupported;
        if (filter === 'attention') return p.feedStatus === 'outage';
        if (filter === 'new') return !p.stats.rated;
        if (filter === 'paused') return p.status === 'paused';
        return true;
      })
      .filter((p) => !q || [p.name, p.contactName, ...p.serviceAreas].some((v) => v.toLowerCase().includes(q)));
  }, [partners, filter, query]);

  /* ------------------------------------------------- add or edit a carrier */
  const [formOpen, setFormOpen] = useState<'create' | 'edit' | null>(null);
  const [draft, setDraft] = useState<PartnerDraft>(emptyPartner);
  const patchDraft = (patch: Partial<PartnerDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const openCreate = () => {
    setDraft(emptyPartner);
    setFormOpen('create');
  };
  const openEdit = (p: PartnerRow) => {
    setDraft({ name: p.name, contactName: p.contactName, phone: p.phone, email: p.email ?? '', serviceAreas: p.serviceAreas, liveTrackingSupported: p.liveTrackingSupported, rateCardRef: p.rateCardRef });
    setFormOpen('edit');
  };
  const closeForm = () => setFormOpen(null);
  const canSaveDraft = draft.name.trim().length >= 3 && draft.contactName.trim().length >= 2 && draft.phone.trim().length >= 10 && draft.serviceAreas.length > 0 && draft.rateCardRef.trim().length >= 2;
  const saveDraft = () =>
    run(async () => {
      if (!user) return { ok: false, code: 'forbidden' };
      const input = { ...draft, email: draft.email.trim() || undefined };
      if (formOpen === 'edit' && current) await repository.updateDeliveryPartner(current.id, input, user.id);
      else {
        const created = await repository.createDeliveryPartner(input, user.id);
        setSearchParams({ partner: created.id });
      }
      setFormOpen(null);
      return { ok: true };
    });

  /* ------------------------------------------------------------- a new lane */
  const [laneOpen, setLaneOpen] = useState(false);
  const [lane, setLane] = useState<LaneDraft>(emptyLane);
  const patchLane = (patch: Partial<LaneDraft>) => setLane((l) => ({ ...l, ...patch }));
  const openLane = () => {
    setLane({ ...emptyLane, destinationCity: current?.serviceAreas[0] ?? '' });
    setLaneOpen(true);
  };
  const laneReplaces = !!current && current.lanes.some((l) => l.originCity.toLowerCase() === lane.originCity.trim().toLowerCase() && l.destinationCity.toLowerCase() === lane.destinationCity.trim().toLowerCase());
  const canSaveLane = lane.originCity.trim().length >= 2 && lane.destinationCity.trim().length >= 2 && Number(lane.distanceKm) > 0 && Number(lane.ratePerTrip) > 0 && Number(lane.transitDays) >= 1;
  const saveLane = () =>
    run(async () => {
      if (!user || !current) return { ok: false, code: 'forbidden' };
      await repository.addPartnerLane(current.id, { originCity: lane.originCity, destinationCity: lane.destinationCity, distanceKm: Number(lane.distanceKm), ratePerTrip: Number(lane.ratePerTrip), transitDays: Number(lane.transitDays) }, user.id);
      setLaneOpen(false);
      return { ok: true };
    });

  /* --------------------------------------- pause / resume / feed (with a reason) */
  const [reasonOpen, setReasonOpen] = useState<'pause' | 'resume' | 'outage' | 'back' | null>(null);
  const [reason, setReason] = useState('');
  const openReason = (kind: 'pause' | 'resume' | 'outage' | 'back') => {
    setReason('');
    setReasonOpen(kind);
  };
  const needsReason = reasonOpen === 'pause' || reasonOpen === 'outage';
  const canConfirmReason = !needsReason || reason.trim().length >= 4;
  const confirmReason = () =>
    run(async () => {
      if (!user || !current || !reasonOpen) return { ok: false, code: 'forbidden' };
      if (reasonOpen === 'pause') await repository.setPartnerStatus(current.id, 'paused', reason, user.id);
      else if (reasonOpen === 'resume') await repository.setPartnerStatus(current.id, 'active', reason, user.id);
      else if (reasonOpen === 'outage') await repository.setPartnerFeed(current.id, 'outage', reason, user.id);
      else await repository.setPartnerFeed(current.id, 'connected', reason, user.id);
      setReasonOpen(null);
      return { ok: true };
    });

  /* ---------------------------------------------------------------- booking */
  const bookable = useMemo(() => board?.bookable ?? [], [board]);
  const [snapshot, setSnapshot] = useState<BookablePo | null>(null);
  // Once booked, the order leaves the bookable list, so the confirmation keeps the order it was for.
  const bookingPo: BookablePo | null = useMemo(() => bookable.find((b) => b.poId === poParam) ?? (snapshot && snapshot.poId === poParam ? snapshot : null), [bookable, poParam, snapshot]);
  const [book, setBook] = useState<BookDraft>({ lineIds: [], partnerId: '', vehicleLabel: '', driverName: '', driverPhone: '' });
  const patchBook = (patch: Partial<BookDraft>) => setBook((b) => ({ ...b, ...patch }));
  const [booked, setBooked] = useState<BookPartnerResult | null>(null);
  const openBooking = (po: BookablePo) => {
    // The best carrier is already ticked, so the common case is a vehicle and a driver.
    // A carrier whose live feed is down is still offered, but is not the one already ticked.
    const preferred = po.eligible.find((o) => o.trackingMode !== 'fallback') ?? po.eligible[0];
    setBook({ lineIds: po.lines.map((l) => l.id), partnerId: preferred?.partnerId ?? '', vehicleLabel: '', driverName: '', driverPhone: '' });
    setBooked(null);
    setSnapshot(po);
    setSearchParams({ tab: 'book', poId: po.poId });
  };
  const closeBooking = () => setSearchParams({ tab: 'book' }, { replace: true });
  const toggleLine = (id: string) => setBook((b) => ({ ...b, lineIds: b.lineIds.includes(id) ? b.lineIds.filter((x) => x !== id) : [...b.lineIds, id] }));
  const chosen = bookingPo?.eligible.find((o) => o.partnerId === book.partnerId) ?? null;
  const canBook = !!bookingPo && !!chosen && book.lineIds.length > 0 && book.vehicleLabel.trim().length >= 2 && book.driverName.trim().length >= 2;
  const submitBooking = () =>
    run(async () => {
      if (!user || !bookingPo) return { ok: false, code: 'forbidden' };
      const result = await repository.bookDeliveryPartner(bookingPo.poId, { partnerId: book.partnerId, lineIds: book.lineIds, vehicleLabel: book.vehicleLabel, driverName: book.driverName, driverPhone: book.driverPhone.trim() || undefined }, user.id);
      setBooked(result);
      return { ok: true, booked: result };
    });

  /* ---------------------------------------------------------- delay causes */
  const [causeFilter, setCauseFilter] = useState<CauseFilter>('all');
  const lateShown = useMemo(() => (board?.analysis.late ?? []).filter((l) => causeFilter === 'all' || l.responsibility === causeFilter), [board, causeFilter]);

  return {
    status,
    reload,
    busy,
    board,
    tab,
    setTab,
    partners,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    shown,
    current,
    partnerParam,
    openPartner,
    closePartner,
    formOpen,
    draft,
    patchDraft,
    openCreate,
    openEdit,
    closeForm,
    canSaveDraft,
    saveDraft,
    laneOpen,
    setLaneOpen,
    lane,
    patchLane,
    openLane,
    laneReplaces,
    canSaveLane,
    saveLane,
    reasonOpen,
    setReasonOpen,
    reason,
    setReason,
    openReason,
    needsReason,
    canConfirmReason,
    confirmReason,
    bookable,
    bookingPo,
    book,
    patchBook,
    booked,
    openBooking,
    closeBooking,
    toggleLine,
    chosen,
    canBook,
    submitBooking,
    causeFilter,
    setCauseFilter,
    lateShown,
  };
}
