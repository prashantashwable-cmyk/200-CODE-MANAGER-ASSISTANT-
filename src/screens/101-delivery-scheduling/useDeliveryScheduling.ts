import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DeliveryBoard, DeliveryCard, DeliverySlotView } from '@/data/repository';
import type { DeliveryRescheduleCause, DeliveryWindow, SiteReadinessItem, Supplier } from '@/data/types';
import { CALENDAR_MODES } from '@/features/calendar/calendarMath';
import type { CalendarEvent, CalendarMode } from '@/features/calendar/calendarMath';
import { DELIVERY_WINDOWS, READINESS_ITEMS, laterThanPromise, nextFreeSlots, todayKey } from '@/features/logistics/deliverySlots';
import type { SlotState } from '@/features/logistics/deliverySlots';
import { NEXT_SLOT_CHOICES } from './delivery-scheduling.types';
import type { DeliveryFilter, DeliverySchedulingStatus } from './delivery-scheduling.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
  conflicts?: string[];
  technicianNotified?: boolean;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

/** A card that needs somebody's attention, in calendar colour and in the filter. */
export function hasProblem(c: DeliveryCard): boolean {
  return c.status !== 'delivered' && (c.sequenceConflict || c.readinessLost || c.outsideSupplierWindows || c.status === 'attempt_failed');
}

export interface AvailabilityDraft {
  weekdays: number[];
  windows: DeliveryWindow[];
  maxPerDay: string;
  leadDays: string;
  blackouts: { date: string; reason: string }[];
}

export function useDeliveryScheduling() {
  const repository = useData();
  const { user, role } = useSession();
  const isAdmin = role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const openPoId = searchParams.get('poId');

  const [status, setStatus] = useState<DeliverySchedulingStatus>('loading');
  const [board, setBoard] = useState<DeliveryBoard | null>(null);
  const [ownSupplier, setOwnSupplier] = useState<Supplier | null>(null);
  const [busy, setBusy] = useState(false);

  /* ---------------------------------------------------------- calendar */
  const [mode, setMode] = useState<CalendarMode>(CALENDAR_MODES[0]);
  const [cursor, setCursor] = useState(() => todayKey(Date.now()));
  const [selectedDate, setSelectedDate] = useState<string | null>(() => todayKey(Date.now()));
  const [filter, setFilter] = useState<DeliveryFilter>('all');
  const [supplierFilter, setSupplierFilter] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const next = await repository.getDeliveryBoard(user.id);
      setBoard(next);
      if (!isAdmin) setOwnSupplier(await repository.getSupplierForUser(user.id));
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const allCards = board?.cards ?? [];
  const cards = useMemo(
    () =>
      allCards
        .filter((c) => !supplierFilter || c.supplier.id === supplierFilter)
        .filter((c) => (filter === 'to_book' ? c.status === 'unscheduled' || c.status === 'attempt_failed' : filter === 'attention' ? hasProblem(c) || c.laterThanPromise : true)),
    [allCards, filter, supplierFilter],
  );
  const suppliers = useMemo(() => [...new Map(allCards.map((c) => [c.supplier.id, c.supplier.name])).entries()].map(([id, name]) => ({ id, name })), [allCards]);

  const events: CalendarEvent[] = useMemo(
    () =>
      cards
        .filter((c) => c.schedule?.status === 'scheduled' && c.schedule.date)
        .map((c) => ({
          id: c.poId,
          date: c.schedule!.date!,
          label: `${c.supplier.name.split(' ')[0]} · ${c.poCode.split('-').pop()}`,
          tone: c.status === 'delivered' ? ('success' as const) : hasProblem(c) ? ('error' as const) : c.laterThanPromise ? ('warning' as const) : ('accent' as const),
        })),
    [cards],
  );
  const cardsOn = (date: string | null) => cards.filter((c) => c.schedule?.status === 'scheduled' && c.schedule.date === date);
  const queue = useMemo(
    () => cards.filter((c) => c.status === 'unscheduled' || c.status === 'attempt_failed').sort((a, b) => (a.promisedDelivery ?? '9999') < (b.promisedDelivery ?? '9999') ? -1 : 1),
    [cards],
  );

  const selectDate = (key: string) => {
    setSelectedDate(key);
    // A tapped day outside the visible month follows the grid there.
    if (mode === 'month' && key.slice(0, 7) !== cursor.slice(0, 7)) setCursor(key);
  };

  /* --------------------------------------------------------- the sheet */
  const openCard = useMemo(() => allCards.find((c) => c.poId === openPoId) ?? null, [allCards, openPoId]);
  const openSheet = (poId: string) => setSearchParams({ poId });
  const closeSheet = () => setSearchParams({});

  const [slots, setSlots] = useState<DeliverySlotView | null>(null);
  useEffect(() => {
    if (!openPoId || !user) {
      setSlots(null);
      return undefined;
    }
    let live = true;
    void repository.getDeliverySlots(openPoId, user.id).then((v) => live && setSlots(v));
    return () => {
      live = false;
    };
    // Reload after a booking or a change to the supplier's windows.
  }, [repository, user, openPoId, board]);

  const run = async (fn: () => Promise<unknown>): Promise<ActionResult> => {
    setBusy(true);
    try {
      const value = await fn();
      await load();
      const result = value as { conflicts?: string[]; technicianNotified?: boolean } | undefined;
      return { ok: true, conflicts: result?.conflicts, technicianNotified: result?.technicianNotified };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------------------- readiness */
  const [readyItems, setReadyItems] = useState<Record<SiteReadinessItem, boolean>>(() => Object.fromEntries(READINESS_ITEMS.map((k) => [k, false])) as Record<SiteReadinessItem, boolean>);
  const [contact, setContact] = useState('');
  const readinessKey = openCard ? `${openCard.poId}|${JSON.stringify(openCard.readiness.items)}|${openCard.readiness.confirmedAt ?? ''}|${openCard.readiness.resetAt ?? ''}` : '';
  useEffect(() => {
    if (!openCard) return;
    setReadyItems(openCard.readiness.items);
    setContact(openCard.readiness.contactName ?? '');
    // Only when the record itself changes — never mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readinessKey]);
  const allReady = READINESS_ITEMS.every((k) => readyItems[k]);
  const toggleReady = (item: SiteReadinessItem, value: boolean) => setReadyItems((r) => ({ ...r, [item]: value }));
  const saveReadiness = () =>
    openCard && user ? run(() => repository.setSiteReadiness(openCard.dealId, { items: readyItems, contactName: contact }, user.id)) : Promise.resolve<ActionResult>({ ok: false });

  /* ------------------------------------------------------------ booking */
  const [bookDate, setBookDate] = useState('');
  const [bookWindow, setBookWindow] = useState<DeliveryWindow | ''>('');
  const [dependsOn, setDependsOn] = useState('');
  const [lateCause, setLateCause] = useState<DeliveryRescheduleCause | ''>('');
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveCause, setMoveCause] = useState<DeliveryRescheduleCause>('site');
  const [moveReason, setMoveReason] = useState('');
  const [attemptOpen, setAttemptOpen] = useState(false);
  const [attemptNote, setAttemptNote] = useState('');

  useEffect(() => {
    setBookDate('');
    setBookWindow('');
    setLateCause('');
    setMoveOpen(false);
    setMoveReason('');
    setMoveCause(isAdmin ? 'site' : 'supplier');
    setAttemptOpen(false);
    setAttemptNote('');
  }, [openPoId, isAdmin]);
  useEffect(() => {
    setDependsOn(openCard?.dependsOn?.poId ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPoId, openCard?.dependsOn?.poId]);

  const stateOf = useCallback(
    (date: string, window: DeliveryWindow): SlotState | null => slots?.days.find((d) => d.date === date)?.windows.find((w) => w.window === window)?.state ?? null,
    [slots],
  );
  const windowsFor = (date: string) => DELIVERY_WINDOWS.map((window) => ({ window, state: stateOf(date, window) }));
  const freeSlots = useMemo(() => (slots ? nextFreeSlots(slots.days, NEXT_SLOT_CHOICES) : []), [slots]);
  const pickSlot = (date: string, window: DeliveryWindow | '') => {
    setBookDate(date);
    setBookWindow(window);
  };
  const setPickedDate = (date: string) => {
    // Keep the window if it's still bookable that day, else pick the first one that is.
    const free = DELIVERY_WINDOWS.filter((w) => stateOf(date, w) === 'free');
    setBookDate(date);
    setBookWindow(bookWindow && free.includes(bookWindow) ? bookWindow : (free[0] ?? ''));
  };

  const bookedState = bookDate && bookWindow ? stateOf(bookDate, bookWindow) : null;
  const lateBook = !!openCard && !!bookDate && laterThanPromise(bookDate, openCard.promisedDelivery);
  const canBook = !!openCard && openCard.readinessConfirmed && bookedState === 'free' && (!lateBook || !!lateCause);
  const book = () =>
    openCard && user && bookDate && bookWindow
      ? run(() =>
          repository.scheduleDelivery(
            openCard.poId,
            { date: bookDate, window: bookWindow, dependsOnPoId: dependsOn || null, lateCause: lateBook && lateCause ? lateCause : undefined },
            user.id,
          ),
        ).then((r) => {
          if (r.ok) pickSlot('', '');
          return r;
        })
      : Promise.resolve<ActionResult>({ ok: false });

  const currentDependsOn = openCard?.dependsOn?.poId ?? '';
  const changedDependency = dependsOn !== currentDependsOn;
  const lateMove = !!openCard && !!bookDate && laterThanPromise(bookDate, openCard.promisedDelivery);
  const slotChanged = !!bookDate && !!bookWindow && (bookDate !== openCard?.schedule?.date || bookWindow !== openCard?.schedule?.window);
  const canMove = !!openCard && bookedState === 'free' && (slotChanged || changedDependency) && moveReason.trim().length >= 4 && (!isAdmin || openCard.readinessConfirmed);
  const move = () =>
    openCard && user && openCard.schedule?.date && openCard.schedule.window
      ? run(() =>
          repository.rescheduleDelivery(
            openCard.poId,
            {
              date: bookDate || openCard.schedule!.date!,
              window: (bookWindow || openCard.schedule!.window!) as DeliveryWindow,
              cause: isAdmin ? moveCause : 'supplier',
              reason: moveReason,
              dependsOnPoId: changedDependency ? dependsOn || null : undefined,
            },
            user.id,
          ),
        ).then((r) => {
          if (r.ok) {
            setMoveOpen(false);
            setMoveReason('');
            pickSlot('', '');
          }
          return r;
        })
      : Promise.resolve<ActionResult>({ ok: false });

  const canRecordAttempt = attemptNote.trim().length >= 10;
  const recordAttempt = () =>
    openCard && user
      ? run(() => repository.recordDeliveryAttempt(openCard.poId, attemptNote, user.id)).then((r) => {
          if (r.ok) {
            setAttemptOpen(false);
            setAttemptNote('');
          }
          return r;
        })
      : Promise.resolve<ActionResult>({ ok: false });

  /* ----------------------------------------------------- dispatch windows */
  const [availOpen, setAvailOpen] = useState(false);
  const [availSupplierId, setAvailSupplierId] = useState('');
  const [avail, setAvail] = useState<AvailabilityDraft>({ weekdays: [1, 2, 3, 4, 5], windows: ['morning'], maxPerDay: '1', leadDays: '2', blackouts: [] });
  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  const [newBlackoutReason, setNewBlackoutReason] = useState('');
  const openAvailability = (supplierId?: string) => {
    const id = supplierId ?? ownSupplier?.id ?? '';
    const current = board?.availabilityBySupplier[id] ?? board?.ownAvailability ?? null;
    setAvailSupplierId(id);
    setAvail(
      current && current.supplierId === id
        ? { weekdays: current.weekdays, windows: current.windows, maxPerDay: String(current.maxPerDay), leadDays: String(current.leadDays), blackouts: current.blackouts }
        : { weekdays: [1, 2, 3, 4, 5], windows: ['morning', 'afternoon'], maxPerDay: '1', leadDays: '2', blackouts: [] },
    );
    setNewBlackoutDate('');
    setNewBlackoutReason('');
    setAvailOpen(true);
  };
  const toggleWeekday = (d: number) => setAvail((a) => ({ ...a, weekdays: a.weekdays.includes(d) ? a.weekdays.filter((x) => x !== d) : [...a.weekdays, d].sort() }));
  const toggleWindow = (w: DeliveryWindow) => setAvail((a) => ({ ...a, windows: a.windows.includes(w) ? a.windows.filter((x) => x !== w) : [...a.windows, w] }));
  const addBlackout = () => {
    if (!newBlackoutDate || newBlackoutReason.trim().length < 2) return;
    setAvail((a) => ({ ...a, blackouts: [...a.blackouts.filter((b) => b.date !== newBlackoutDate), { date: newBlackoutDate, reason: newBlackoutReason.trim() }].sort((x, y) => (x.date < y.date ? -1 : 1)) }));
    setNewBlackoutDate('');
    setNewBlackoutReason('');
  };
  const removeBlackout = (date: string) => setAvail((a) => ({ ...a, blackouts: a.blackouts.filter((b) => b.date !== date) }));
  const maxN = Number(avail.maxPerDay);
  const leadN = Number(avail.leadDays);
  const availValid = avail.weekdays.length > 0 && avail.windows.length > 0 && Number.isInteger(maxN) && maxN >= 1 && maxN <= 10 && Number.isInteger(leadN) && leadN >= 0 && leadN <= 30;
  const saveAvailability = () =>
    user && availSupplierId
      ? run(() =>
          repository.saveDispatchAvailability({ supplierId: availSupplierId, weekdays: avail.weekdays, windows: avail.windows, maxPerDay: maxN, leadDays: leadN, blackouts: avail.blackouts }, user.id),
        ).then((r) => {
          if (r.ok) setAvailOpen(false);
          return r;
        })
      : Promise.resolve<ActionResult>({ ok: false });

  return {
    status,
    isAdmin,
    board,
    reload: load,
    busy,
    ownSupplier,
    cards,
    suppliers,
    events,
    queue,
    cardsOn,
    mode,
    setMode,
    cursor,
    setCursor,
    selectedDate,
    selectDate,
    filter,
    setFilter,
    supplierFilter,
    setSupplierFilter,
    openCard,
    openPoId,
    openSheet,
    closeSheet,
    slots,
    readyItems,
    toggleReady,
    contact,
    setContact,
    allReady,
    saveReadiness,
    bookDate,
    bookWindow,
    setBookWindow,
    setPickedDate,
    pickSlot,
    freeSlots,
    windowsFor,
    stateOf,
    bookedState,
    dependsOn,
    setDependsOn,
    lateBook,
    lateMove,
    lateCause,
    setLateCause,
    canBook,
    book,
    moveOpen,
    setMoveOpen,
    moveCause,
    setMoveCause,
    moveReason,
    setMoveReason,
    canMove,
    move,
    attemptOpen,
    setAttemptOpen,
    attemptNote,
    setAttemptNote,
    canRecordAttempt,
    recordAttempt,
    availOpen,
    closeAvailability: () => setAvailOpen(false),
    openAvailability,
    availSupplierId,
    avail,
    setAvail,
    toggleWeekday,
    toggleWindow,
    newBlackoutDate,
    setNewBlackoutDate,
    newBlackoutReason,
    setNewBlackoutReason,
    addBlackout,
    removeBlackout,
    availValid,
    saveAvailability,
  };
}

export type DeliverySchedulingState = ReturnType<typeof useDeliveryScheduling>;
