import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { haversineKm } from '@/design-system';
import type { GeoPoint } from '@/data/types';
import { OUTLIER_MINUTES } from './track-surveyor.types';
import type {
  PathSegment,
  TrackStatus,
  TrackSurveyorData,
  VisitEntry,
} from './track-surveyor.types';

interface TrackSurveyorState {
  status: TrackStatus;
  data: TrackSurveyorData | null;
  date: string;
  setDate: (date: string) => void;
  reload: () => Promise<void>;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Owns one surveyor's day, live or historical.
 *
 * This view is read-only by design: an admin can inspect and flag, but never
 * edit what a surveyor logged. Changing someone's own record would destroy the
 * value of auditing it.
 */
export function useTrackSurveyor(): TrackSurveyorState {
  const { userId } = useParams<{ userId: string }>();
  const repository = useData();

  const [status, setStatus] = useState<TrackStatus>('loading');
  const [data, setData] = useState<TrackSurveyorData | null>(null);
  const [date, setDate] = useState<string>(todayIso());

  const load = useCallback(async () => {
    if (!userId) {
      setStatus('notFound');
      return;
    }
    setStatus('loading');
    try {
      const surveyor = await repository.getUser(userId);
      if (!surveyor || surveyor.role !== 'surveyor') {
        setStatus('notFound');
        return;
      }

      // Asking for a date before they joined is a legitimate question with an
      // empty answer, not an error.
      if (surveyor.joinedAt && date < surveyor.joinedAt.slice(0, 10)) {
        setData(null);
        setStatus('beforeJoining');
        return;
      }

      const [plan, leads, verifications] = await Promise.all([
        repository.getRoutePlan(userId),
        repository.listLeads({ surveyorId: userId }),
        repository.listSiteVisits(),
      ]);

      const ownVerifications = verifications.filter((v) => v.surveyorId === userId);
      const isToday = date === todayIso();
      const stops = isToday ? (plan?.stops ?? []) : [];

      const visits: VisitEntry[] = stops.map((stop, index) => {
        const verification = ownVerifications.find((v) => v.leadId === stop.leadId);
        const lead = leads.find((l) => l.id === stop.leadId);
        const minutesOnSite = verification?.dwellMinutes ?? null;
        return {
          id: stop.id,
          label: stop.label,
          address: stop.address,
          location: stop.location,
          arrivedAt: stop.status === 'pending' ? null : stop.windowStart,
          minutesOnSite,
          isOutlier: minutesOnSite !== null && minutesOnSite > OUTLIER_MINUTES,
          photoCount: verification?.photoCount ?? 0,
          leadCode: lead?.code ?? null,
          flagged: verification ? verification.status === 'flagged' || verification.status === 'rejected' : false,
          flagReason: verification?.flagReason,
          status: stop.status,
        };
      });

      // The travelled path is only what actually happened — stops still
      // pending are not drawn, so a phone that died mid-day simply stops.
      const travelled = visits
        .filter((v) => v.status !== 'pending')
        .map((v) => v.location);

      // GPS accuracy metadata rides on the verification records: a big drift
      // means that stretch is unreliable and should be drawn faintly rather
      // than presented with the same confidence as the rest.
      const segments: PathSegment[] = [];
      let current: GeoPoint[] = [];
      let currentLowAccuracy = false;
      visits
        .filter((v) => v.status !== 'pending')
        .forEach((visit, index) => {
          const verification = ownVerifications.find((v) => v.leadId === stops[index]?.leadId);
          const low = (verification?.gpsDriftMetres ?? 0) > 100;
          if (current.length > 0 && low !== currentLowAccuracy) {
            segments.push({ id: `seg-${segments.length}`, points: [...current], lowAccuracy: currentLowAccuracy });
            current = [current[current.length - 1]];
          }
          currentLowAccuracy = low;
          current.push(visit.location);
        });
      if (current.length > 1) {
        segments.push({ id: `seg-${segments.length}`, points: current, lowAccuracy: currentLowAccuracy });
      }

      let distanceKm = 0;
      for (let i = 1; i < travelled.length; i += 1) {
        distanceKm += haversineKm(travelled[i - 1], travelled[i]);
      }

      const dwellTimes = visits
        .map((v) => v.minutesOnSite)
        .filter((m): m is number => m !== null);

      const dayStart = new Date(`${date}T00:00:00`).getTime();
      const dayEnd = dayStart + 86_400_000;
      const leadsToday = leads.filter((l) => {
        const t = new Date(l.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      });

      const minutesSincePing = surveyor.lastSeenAt
        ? Math.floor((Date.now() - new Date(surveyor.lastSeenAt).getTime()) / 60_000)
        : -1;

      const next: TrackSurveyorData = {
        surveyor,
        visits,
        segments,
        leads,
        verifications: ownVerifications,
        minutesSincePing,
        stats: {
          distanceKm: Math.round(distanceKm * 10) / 10,
          leadsCaptured: leadsToday.length,
          averageMinutesPerSite: dwellTimes.length
            ? Math.round(dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length)
            : null,
          duplicateFlagged: ownVerifications.filter(
            (v) => v.status === 'flagged' || v.status === 'rejected',
          ).length,
          stopsDone: visits.filter((v) => v.status === 'done').length,
          stopsTotal: visits.length,
        },
      };

      setData(next);
      setStatus(visits.length === 0 && leadsToday.length === 0 ? 'empty' : 'ready');
    } catch {
      setStatus('error');
    }
  }, [userId, repository, date]);

  useEffect(() => {
    void load();
  }, [load]);

  return { status, data, date, setDate, reload: load };
}
