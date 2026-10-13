import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DispatchablePo, ShipmentBoard, ShipmentView } from '@/data/repository';
import type { ShipmentMilestone, ShipmentTrackingSource } from '@/data/types';
import { MANUAL_MILESTONES, POLL_MS } from './shipment-tracking.types';
import type { ShipmentTrackingStatus } from './shipment-tracking.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

/** `datetime-local` wants local wall-clock time, not UTC. */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function useShipmentTracking() {
  const repository = useData();
  const { user, role } = useSession();
  const isAdmin = role === 'admin';
  const isSupplier = role === 'supplier';
  const isCustomer = role === 'customer';
  const canDispatch = isAdmin || isSupplier;
  const [searchParams, setSearchParams] = useSearchParams();
  const legParam = searchParams.get('leg');
  const poParam = searchParams.get('poId');

  const [status, setStatus] = useState<ShipmentTrackingStatus>('loading');
  const [board, setBoard] = useState<ShipmentBoard | null>(null);
  const [busy, setBusy] = useState(false);
  // The countdown moves between polls, so it reads its own clock.
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBoard(await repository.getShipmentBoard(user.id));
      setStatus('ready');
    } catch {
      // A failed refresh never blanks a board that is already showing.
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    const tick = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
  }, [load]);

  const reload = () => {
    setStatus('loading');
    void load();
  };

  const shipments = useMemo(() => board?.shipments ?? [], [board]);
  const dispatchable = useMemo(() => board?.dispatchable ?? [], [board]);

  /* ------------------------------------------------------- the selected leg */
  const selected: ShipmentView | null = useMemo(() => {
    if (shipments.length === 0) return null;
    return (
      shipments.find((s) => s.legId === legParam) ??
      shipments.find((s) => s.poId === poParam && !s.arrived) ??
      shipments.find((s) => s.poId === poParam) ??
      shipments.find((s) => !s.arrived) ??
      shipments[0]
    );
  }, [shipments, legParam, poParam]);
  const select = (legId: string) => setSearchParams({ leg: legId }, { replace: true });

  /* --------------------------------------------------------- dispatching */
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchPoId, setDispatchPoId] = useState('');
  const [lineIds, setLineIds] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<ShipmentTrackingSource>('live_gps');

  const dispatchPo: DispatchablePo | null = dispatchable.find((p) => p.poId === dispatchPoId) ?? null;

  const openDispatch = (poId?: string) => {
    const first = dispatchable.find((p) => p.poId === poId) ?? dispatchable[0] ?? null;
    setDispatchPoId(first?.poId ?? '');
    // Everything ready goes on the vehicle unless someone unticks it.
    setLineIds(first ? first.lines.map((l) => l.id) : []);
    setVehicle('');
    setDriver('');
    setPhone('');
    setSource('live_gps');
    setDispatchOpen(true);
  };
  const pickDispatchPo = (poId: string) => {
    setDispatchPoId(poId);
    setLineIds(dispatchable.find((p) => p.poId === poId)?.lines.map((l) => l.id) ?? []);
  };
  const toggleLine = (id: string, on: boolean) => setLineIds((cur) => (on ? [...new Set([...cur, id])] : cur.filter((x) => x !== id)));
  const canDispatchNow = !!dispatchPo && lineIds.length > 0 && vehicle.trim().length >= 2 && driver.trim().length >= 2;

  const dispatch = async (): Promise<ActionResult & { legId?: string }> => {
    if (!user || !dispatchPo || !canDispatchNow) return { ok: false, code: 'invalid_input' };
    setBusy(true);
    try {
      const created = await repository.dispatchShipment(
        dispatchPo.poId,
        { lineIds, vehicleLabel: vehicle, driverName: driver, driverPhone: phone || undefined, source },
        user.id,
      );
      setDispatchOpen(false);
      await load();
      select(created.legId);
      return { ok: true, legId: created.legId };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------- manual update */
  const [updateOpen, setUpdateOpen] = useState(false);
  const [milestone, setMilestone] = useState<ShipmentMilestone | ''>('');
  const [note, setNote] = useState('');
  const [etaLocal, setEtaLocal] = useState('');

  /** Only milestones ahead of where the leg already is. */
  const offeredMilestones = useMemo(() => {
    if (!selected) return [];
    const at = ['dispatched', 'in_transit', 'nearby', 'arrived'].indexOf(selected.milestone);
    return MANUAL_MILESTONES.filter((m) => ['dispatched', 'in_transit', 'nearby', 'arrived'].indexOf(m) > at);
  }, [selected]);

  const openUpdate = () => {
    setMilestone(offeredMilestones[0] ?? '');
    setNote('');
    setEtaLocal(selected ? toLocalInput(selected.etaAt) : '');
    setUpdateOpen(true);
  };
  // AIEC speaking for a supplier says where the word came from.
  const noteRequired = isAdmin;
  const canUpdateNow = !!selected && !!milestone && (!noteRequired || note.trim().length >= 4);

  const submitUpdate = async (): Promise<ActionResult> => {
    if (!user || !selected || !milestone || !canUpdateNow) return { ok: false, code: 'invalid_input' };
    setBusy(true);
    try {
      await repository.updateShipmentMilestone(
        selected.legId,
        {
          milestone,
          note: note.trim() || undefined,
          etaAt: milestone !== 'arrived' && etaLocal ? new Date(etaLocal).toISOString() : undefined,
        },
        user.id,
      );
      setUpdateOpen(false);
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
    shipments,
    dispatchable,
    selected,
    select,
    reload,
    now,
    busy,
    isAdmin,
    isSupplier,
    isCustomer,
    canDispatch,
    // dispatch
    dispatchOpen,
    setDispatchOpen,
    openDispatch,
    dispatchPo,
    pickDispatchPo,
    lineIds,
    toggleLine,
    vehicle,
    setVehicle,
    driver,
    setDriver,
    phone,
    setPhone,
    source,
    setSource,
    canDispatchNow,
    dispatch,
    // manual update
    updateOpen,
    setUpdateOpen,
    openUpdate,
    offeredMilestones,
    milestone,
    setMilestone,
    note,
    setNote,
    etaLocal,
    setEtaLocal,
    noteRequired,
    canUpdateNow,
    submitUpdate,
  };
}

export type ShipmentTrackingState = ReturnType<typeof useShipmentTracking>;
