import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { leaveSeverity } from '@/features/technician/presence';
import { haversineKm } from '@/design-system';
import { CHECKIN_RADIUS_METRES, HIGH_RISK_STEP_IDS } from './track-technician.types';
import type {
  AnomalyFinding,
  CrewMember,
  TechTrackData,
  TechTrackStatus,
} from './track-technician.types';

interface TrackTechnicianState {
  status: TechTrackStatus;
  data: TechTrackData | null;
  reload: () => Promise<void>;
}

const POLL_MS = 20_000;

/**
 * Owns one technician's current installation.
 *
 * The anomaly list is the point of this screen. Each finding is a specific
 * condition an admin would otherwise only catch by reading every timestamp —
 * and the one that matters most, a checkout with safety steps still open, is
 * raised as critical so it cannot be scrolled past.
 */
export function useTrackTechnician(): TrackTechnicianState {
  const { userId } = useParams<{ userId: string }>();
  const repository = useData();
  const { user: viewer } = useSession();

  const [status, setStatus] = useState<TechTrackStatus>('loading');
  const [data, setData] = useState<TechTrackData | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setStatus('notFound');
      return;
    }
    try {
      const technician = await repository.getUser(userId);
      if (!technician || technician.role !== 'technician') {
        setStatus('notFound');
        return;
      }

      const [jobs, users] = await Promise.all([repository.listJobs(), repository.listUsers()]);

      // The live job is the one they are assigned to that is not finished.
      const job =
        jobs.find((j) => j.technicianId === userId && j.status !== 'completed') ?? null;

      if (!job) {
        setData({
          technician,
          job: null,
          crew: [],
          steps: [],
          currentStep: null,
          completedSteps: 0,
          evidenceCount: 0,
          checkInAt: null,
          checkOutAt: null,
          hoursOnSite: null,
          distanceFromSiteMetres: null,
          minutesSincePing: technician.lastSeenAt
            ? Math.floor((Date.now() - new Date(technician.lastSeenAt).getTime()) / 60_000)
            : -1,
          anomalies: [],
        });
        setStatus('noJob');
        return;
      }

      const distanceMetres = technician.location
        ? Math.round(haversineKm(technician.location, job.location) * 1000)
        : null;

      const minutesSincePing = technician.lastSeenAt
        ? Math.floor((Date.now() - new Date(technician.lastSeenAt).getTime()) / 60_000)
        : -1;

      // Who was on site and when is the check-in record (125), one per person and visit: this screen reads it, never a second guess.
      const site = viewer ? await repository.getSiteTime(job.id, viewer.id).catch(() => null) : null;
      const mine = (site?.visits ?? []).filter((v) => v.userId === userId);
      const latest = mine[0] ?? null;
      const openVisit = mine.find((v) => !v.checkOutAt && !v.stale) ?? null;
      const person = site?.team.find((p) => p.userId === userId);
      const checkInAt = latest?.checkInAt ?? null;
      const checkOutAt = latest?.checkOutAt ?? null;
      const hoursOnSite = person ? Math.round((person.minutes / 60) * 10) / 10 : null;

      // Everyone assigned to this site, so a multi-technician job reads as one
      // job rather than several disconnected screens.
      const crew: CrewMember[] = jobs
        .filter((j) => j.dealId === job.dealId && j.technicianId)
        .map((j) => users.find((u) => u.id === j.technicianId))
        .filter((u): u is NonNullable<typeof u> => Boolean(u))
        .filter((u, index, list) => list.findIndex((x) => x.id === u.id) === index)
        .map((user) => {
          const gap = user.location
            ? Math.round(haversineKm(user.location, job.location) * 1000)
            : null;
          return {
            user,
            checkedIn: site ? !!site.team.find((p) => p.userId === user.id)?.onSiteNow : gap !== null && gap <= CHECKIN_RADIUS_METRES,
            distanceMetres: gap,
            minutesSincePing: user.lastSeenAt
              ? Math.floor((Date.now() - new Date(user.lastSeenAt).getTime()) / 60_000)
              : -1,
          };
        });

      const completedSteps = job.steps.filter((s) => s.status === 'complete').length;
      const currentStep = job.steps.find((s) => s.status === 'current') ?? null;
      const evidenceCount = job.steps.reduce((sum, s) => sum + s.evidenceCount, 0);

      const anomalies: AnomalyFinding[] = [];

      if (openVisit && distanceMetres !== null && distanceMetres > CHECKIN_RADIUS_METRES) {
        // Two different problems share this shape, and which one it is depends
        // on whether a high-risk step is open right now.
        const onHighRiskStep = currentStep !== null && HIGH_RISK_STEP_IDS.includes(currentStep.id);
        if (onHighRiskStep) {
          anomalies.push({
            id: 'leftDuringCriticalStep',
            severity: 'critical',
            context: `${job.code} · ${distanceMetres} m`,
          });
        } else {
          anomalies.push({
            id: 'checkInOutOfRange',
            severity: 'high',
            context: `${job.code} · ${distanceMetres} m`,
          });
        }
      }

      // A visit today that the schedule does not know about.
      const scheduledToday =
        new Date(job.scheduledFor).toDateString() === new Date().toDateString();
      // A job already under way is on site every day it takes: only a job not yet started is expected on its booked day.
      if (openVisit && !scheduledToday && (job.status === 'scheduled' || job.status === 'materials_pending')) {
        anomalies.push({
          id: 'unscheduledCheckIn',
          severity: 'medium',
          context: job.code,
        });
      }

      // Left the site with steps of their own still open (told at the moment they checked out, with their reason).
      const left = mine.find((v) => v.checkOutAt && v.leave && v.leave.openSteps > 0 && Date.now() - new Date(v.checkOutAt).getTime() < 86_400_000);
      if (left && left.leave) {
        const level = leaveSeverity(left.leave.reason, HIGH_RISK_STEP_IDS.includes(currentStep?.id ?? ''));
        anomalies.push({ id: 'checkoutIncomplete', severity: level === 'low' ? 'medium' : level, context: `${job.code} · ${left.leave.openSteps}` });
      }
      // An arrival that did not match the site, or had no location, and the reason they gave.
      const odd = mine.find((v) => (v.verdict === 'mismatch' || v.verdict === 'unverified') && Date.now() - new Date(v.checkInAt).getTime() < 86_400_000);
      if (odd && !anomalies.some((a) => a.id === 'checkInOutOfRange')) {
        anomalies.push({ id: 'checkInOutOfRange', severity: 'medium', context: `${job.code} · ${odd.driftM ?? '—'} m` });
      }
      // Still checked in from an earlier day: forgotten, and not counted until they say when they left.
      const forgotten = mine.find((v) => v.stale);
      if (forgotten) anomalies.push({ id: 'visitUnconfirmed', severity: 'medium', context: job.code });

      const blocked = job.steps.find(
        (s) => s.requiresEvidence && s.status === 'current' && s.evidenceCount === 0,
      );
      if (blocked) {
        anomalies.push({ id: 'blockedStepNoEvidence', severity: 'high', context: job.code });
      }

      if (minutesSincePing >= 20 && job.status === 'in_progress') {
        anomalies.push({
          id: 'signalLost',
          severity: 'medium',
          context: String(minutesSincePing),
        });
      }

      setData({
        technician,
        job,
        crew,
        steps: job.steps,
        currentStep,
        completedSteps,
        evidenceCount,
        checkInAt,
        checkOutAt,
        hoursOnSite,
        distanceFromSiteMetres: distanceMetres,
        minutesSincePing,
        anomalies,
      });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [userId, repository, viewer]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  return { status, data, reload: load };
}
