import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { haversineKm, useToast } from '@/design-system';
import type { SiteTimeView } from '@/data/repository';
import type { GeoPoint, SiteLeaveReason } from '@/data/types';
import { OVERRIDE_REASON_MIN, readPresence } from '@/features/technician/presence';
import type { PresenceRead } from '@/features/technician/presence';
import { applySiteQueue } from '@/features/technician/siteQueue';
import type { SiteQueueInput, SiteQueueItem } from '@/features/technician/siteQueue';
import type { CheckinStatus } from './checkin-checkout.types';
import { CHECKIN_KEYS as K, FINAL_ERRORS, PING_MS, POLL_MS, jobPath, queueKey, viewKey } from './checkin-checkout.types';
import { newClientId } from '@/features/ids/clientId';

export interface FailedChange {
  id: string;
  code: string;
}

export type GeoPhase = 'locating' | 'ready' | 'denied' | 'unavailable';

export interface GeoState {
  phase: GeoPhase;
  point: GeoPoint | null;
  accuracyM: number | null;
  at: number | null;
}

const isFinal = (code: string) => (FINAL_ERRORS as readonly string[]).includes(code);
const newId = (): string => newClientId();

function readQueue(key: string): SiteQueueItem[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SiteQueueItem[]) : [];
  } catch {
    return [];
  }
}
function readView(key: string): SiteTimeView | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SiteTimeView) : null;
  } catch {
    return null;
  }
}

export type CheckinState = ReturnType<typeof useCheckinCheckout>;

/**
 * Screen 125. The phone's position is watched while the screen is open and judged against the site with the same rules the server uses
 * (`readPresence`), so what the button promises is what the repository will decide. Arriving and leaving are written down on the phone
 * with the moment they happened and sent when the network allows, so a basement with no signal never blocks the record.
 */
export function useCheckinCheckout() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const qKey = user ? queueKey(user.id) : '';
  const vKey = user && jobId ? viewKey(user.id, jobId) : '';
  const [server, setServer] = useState<SiteTimeView | null>(() => (vKey ? readView(vKey) : null));
  const [status, setStatus] = useState<CheckinStatus>(() => (server ? 'ready' : 'loading'));
  const [queue, setQueue] = useState<SiteQueueItem[]>(() => (qKey ? readQueue(qKey) : []));
  const [failed, setFailed] = useState<FailedChange[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [now, setNow] = useState(Date.now());
  const [geo, setGeo] = useState<GeoState>({ phase: 'locating', point: null, accuracyM: null, at: null });
  const [geoTry, setGeoTry] = useState(0);
  const flushing = useRef(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const geoRef = useRef(geo);
  geoRef.current = geo;

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // A running clock, for the live on-site duration.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // The phone's position, kept fresh while the screen is open.
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeo({ phase: 'unavailable', point: null, accuracyM: null, at: null });
      return undefined;
    }
    setGeo((g) => ({ ...g, phase: g.point ? g.phase : 'locating' }));
    const id = navigator.geolocation.watchPosition(
      (p) => setGeo({ phase: 'ready', point: { lat: p.coords.latitude, lng: p.coords.longitude }, accuracyM: Math.round(p.coords.accuracy), at: Date.now() }),
      (e) => setGeo((g) => (e.code === 1 ? { phase: 'denied', point: null, accuracyM: null, at: null } : g.point ? g : { phase: 'unavailable', point: null, accuracyM: null, at: null })),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [geoTry]);

  const persist = useCallback(
    (next: SiteQueueItem[]) => {
      queueRef.current = next;
      setQueue(next);
      if (!qKey) return;
      try {
        if (next.length === 0) localStorage.removeItem(qKey);
        else localStorage.setItem(qKey, JSON.stringify(next));
      } catch {
        // Storage full: the change is still held while the app stays open.
      }
    },
    [qKey],
  );

  const load = useCallback(async () => {
    if (!user || !jobId || !navigator.onLine) return;
    try {
      const fresh = await repository.getSiteTime(jobId, user.id);
      setServer(fresh);
      setStatus('ready');
      try {
        localStorage.setItem(viewKey(user.id, jobId), JSON.stringify(fresh));
      } catch {
        // Not cached: the in-memory copy serves this session.
      }
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'not_found' || code === 'forbidden') setStatus('not_found');
      else setStatus((c) => (c === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId]);

  const flush = useCallback(async () => {
    if (!user || flushing.current || !navigator.onLine || queueRef.current.length === 0) return;
    flushing.current = true;
    setSyncing(true);
    try {
      for (const item of [...queueRef.current]) {
        try {
          if (item.kind === 'in') await repository.checkInToSite(item.jobId, user.id, { location: item.location, accuracyM: item.accuracyM, capturedAt: item.capturedAt, reason: item.reason });
          else if (item.kind === 'out') await repository.checkOutOfSite(item.jobId, user.id, { location: item.location, capturedAt: item.capturedAt, leaveReason: item.leaveReason, note: item.note });
          else await repository.confirmLateCheckout(item.visitId, user.id, item.leftAt, item.note);
          persist(queueRef.current.filter((q) => q.id !== item.id));
        } catch (e) {
          const code = e instanceof Error ? e.message : 'generic';
          if (!isFinal(code)) break;
          persist(queueRef.current.filter((q) => q.id !== item.id));
          setFailed((f) => [...f, { id: item.id, code }]);
        }
      }
    } finally {
      flushing.current = false;
      setSyncing(false);
      await load();
    }
  }, [repository, user, persist, load]);

  useEffect(() => {
    const kept = vKey ? readView(vKey) : null;
    setServer(kept);
    setStatus(kept ? 'ready' : 'loading');
    void load().then(() => flush());
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, flush, vKey]);
  useEffect(() => {
    if (isOnline) void flush();
  }, [isOnline, flush]);

  const enqueue = useCallback(
    (item: SiteQueueInput, at?: string) => {
      if (!jobId) return;
      persist([...queueRef.current, { ...item, id: newId(), jobId, capturedAt: at ?? new Date().toISOString() } as SiteQueueItem]);
      void flush();
    },
    [jobId, persist, flush],
  );

  const view = useMemo(() => (server && user ? applySiteQueue(server, queue, { id: user.id, name: user.name }) : null), [server, queue, user]);

  // The live map's copy of where this person is: sent every minute while checked in.
  useEffect(() => {
    if (!user || !view?.mine || view.mine.stale || !isOnline) return undefined;
    const send = () => {
      const g = geoRef.current;
      if (g.point) void repository.pingSiteLocation(user.id, g.point).catch(() => undefined);
    };
    send();
    const id = window.setInterval(send, PING_MS);
    return () => window.clearInterval(id);
  }, [repository, user, view?.mine?.id, view?.mine?.stale, isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  /** What the phone's position says about this site right now, by the same rules the server applies. */
  const read: PresenceRead | null = useMemo(() => {
    if (!view) return null;
    const driftM = geo.point ? Math.round(haversineKm(geo.point, view.job.location) * 1000) : null;
    return readPresence({ driftM, accuracyM: geo.accuracyM, radiusM: view.job.radiusM });
  }, [view, geo.point, geo.accuracyM]);

  const queued = queue.filter((q) => q.jobId === jobId);

  const checkIn = (reason: string, withoutGps: boolean) => {
    if (!view) return;
    const location = withoutGps ? null : geo.point;
    enqueue({ kind: 'in', location, accuracyM: withoutGps ? null : geo.accuracyM, ...(reason.trim() ? { reason: reason.trim() } : {}) });
    push(t(isOnline ? K.checkIn.toast : K.checkIn.toastQueued), 'success');
  };
  const checkOut = (leaveReason: SiteLeaveReason | undefined, note: string) => {
    enqueue({ kind: 'out', location: geo.point, ...(leaveReason ? { leaveReason } : {}), ...(note.trim() ? { note: note.trim() } : {}) });
    push(t(isOnline ? K.checkOut.toast : K.checkOut.toastQueued), 'success');
  };
  const confirmLate = (visitId: string, leftAtIso: string, note: string) => {
    enqueue({ kind: 'late', visitId, leftAt: leftAtIso, ...(note.trim() ? { note: note.trim() } : {}) });
    push(t(K.stale.toast), 'success');
  };

  return {
    status,
    reload: () => {
      setStatus('loading');
      void load();
    },
    view,
    now,
    geo,
    retryGeo: () => {
      setGeo({ phase: 'locating', point: null, accuracyM: null, at: null });
      setGeoTry((n) => n + 1);
    },
    read,
    isOnline,
    syncing,
    queue: queued,
    failed,
    dismissFailed: () => setFailed([]),
    checkIn,
    checkOut,
    confirmLate,
    reasonMin: OVERRIDE_REASON_MIN,
    toJob: () => navigate(jobPath(jobId ?? '')),
    goto: (path: string) => navigate(path),
  };
}
