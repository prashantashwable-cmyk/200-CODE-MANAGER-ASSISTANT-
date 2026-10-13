import { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { haversineKm } from '@/design-system';
import type { GeoPoint, User } from '@/data/types';
import {
  IMPLAUSIBLE_JUMP_KM,
  LOST_SIGNAL_MS,
  ONSITE_RADIUS_KM,
  POLL_INTERVAL_MS,
} from './live-map.types';
import type { LiveMapData, LiveStatus, PinCluster, StaffPin, StaffStatus } from './live-map.types';

interface LiveMapState {
  status: LiveStatus;
  data: LiveMapData | null;
  lastUpdatedAt: string | null;
  retry: () => void;
}

/** Round to ~11m so people genuinely at one address share a cluster key. */
const clusterKey = (lat: number, lng: number) => `${lat.toFixed(4)}:${lng.toFixed(4)}`;

/**
 * Owns the map's live connection.
 *
 * Two things here are not cosmetic. First, a failed poll after a good one is a
 * reconnection, not an error — the map keeps showing the last known picture
 * rather than blanking. Second, raw GPS is smoothed: a fix that jumps further
 * than any vehicle could travel between pings is treated as noise and eased
 * toward, so a pin never teleports across the city.
 */
export function useLiveMap(): LiveMapState {
  const repository = useData();
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [data, setData] = useState<LiveMapData | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  /** Last drawn position per person, so smoothing has something to smooth from. */
  const smoothedRef = useRef<Map<string, GeoPoint>>(new Map());
  const hasLoadedRef = useRef(false);

  const smooth = useCallback((user: User, raw: GeoPoint): GeoPoint => {
    const previous = smoothedRef.current.get(user.id);
    if (!previous) {
      smoothedRef.current.set(user.id, raw);
      return raw;
    }
    const jump = haversineKm(previous, raw);
    if (jump > IMPLAUSIBLE_JUMP_KM) {
      // Ease a third of the way rather than accepting the jump outright, so a
      // genuine long move still converges over a few polls.
      const eased: GeoPoint = {
        lat: previous.lat + (raw.lat - previous.lat) / 3,
        lng: previous.lng + (raw.lng - previous.lng) / 3,
      };
      smoothedRef.current.set(user.id, eased);
      return eased;
    }
    smoothedRef.current.set(user.id, raw);
    return raw;
  }, []);

  const load = useCallback(async () => {
    // A refresh that fails after a good load is a reconnection, not a failure.
    setStatus(hasLoadedRef.current ? 'reconnecting' : 'connecting');
    try {
      const [users, leads, jobs, zones, alerts] = await Promise.all([
        repository.listUsers(),
        repository.listLeads(),
        repository.listJobs(),
        repository.listZones(),
        repository.listAlerts({ status: ['open'] }),
      ]);

      const now = Date.now();
      const field = users.filter(
        (u) => (u.role === 'surveyor' || u.role === 'technician') && u.location,
      );

      const staff: StaffPin[] = field.map((user) => {
        const raw = user.location as GeoPoint;
        const position = smooth(user, raw);
        const sincePing = user.lastSeenAt ? now - new Date(user.lastSeenAt).getTime() : Infinity;

        // Which site, if any, is this person standing at right now?
        const nearbyJob = jobs.find(
          (job) => job.technicianId === user.id && haversineKm(position, job.location) <= ONSITE_RADIUS_KM,
        );
        const nearbyLead = leads.find(
          (lead) => lead.surveyorId === user.id && haversineKm(position, lead.location) <= ONSITE_RADIUS_KM,
        );

        // Order matters: someone off duty is not "lost", they have finished
        // for the day. The lost-signal flag only applies during working hours,
        // which is what makes it worth an admin's attention.
        let staffStatus: StaffStatus;
        if (!user.onDuty) staffStatus = 'idle';
        else if (sincePing > LOST_SIGNAL_MS) staffStatus = 'lostSignal';
        else if (nearbyJob || nearbyLead) staffStatus = 'onsite';
        else staffStatus = 'traveling';

        return {
          user,
          status: staffStatus,
          lat: position.lat,
          lng: position.lng,
          minutesSincePing: Number.isFinite(sincePing) ? Math.floor(sincePing / 60_000) : -1,
          activeTaskLabel: nearbyJob?.siteName ?? nearbyLead?.siteName ?? null,
          activeTaskId: nearbyJob?.id ?? nearbyLead?.id ?? null,
        };
      });

      // Cluster anyone sharing a coordinate — a shared vehicle should read as
      // "2 here", not two pins stacked illegibly on top of each other.
      const grouped = new Map<string, StaffPin[]>();
      for (const pin of staff) {
        const key = clusterKey(pin.lat, pin.lng);
        grouped.set(key, [...(grouped.get(key) ?? []), pin]);
      }
      const clusters: PinCluster[] = [...grouped.entries()]
        .filter(([, members]) => members.length > 1)
        .map(([key, members]) => ({
          id: key,
          lat: members[0].lat,
          lng: members[0].lng,
          members,
        }));

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      setData({
        staff,
        clusters,
        leads,
        jobs,
        zones,
        alerts,
        counters: {
          onDuty: field.filter((u) => u.onDuty).length,
          leadsToday: leads.filter((l) => new Date(l.createdAt).getTime() >= startOfToday.getTime())
            .length,
          jobsInProgress: jobs.filter((j) => j.status === 'in_progress').length,
          alertsNeedingAttention: alerts.length,
          lostSignal: staff.filter((p) => p.status === 'lostSignal').length,
        },
      });
      setLastUpdatedAt(new Date().toISOString());
      hasLoadedRef.current = true;
      setStatus('live');
    } catch {
      // Only a first-load failure is fatal. After that we keep the last good
      // picture on screen and say we are reconnecting.
      setStatus(hasLoadedRef.current ? 'reconnecting' : 'error');
    }
  }, [repository, smooth]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  return { status, data, lastUpdatedAt, retry: () => void load() };
}
