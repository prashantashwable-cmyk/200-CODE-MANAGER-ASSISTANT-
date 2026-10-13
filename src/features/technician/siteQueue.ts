/**
 * Arriving and leaving without signal, pure (125). A check-in or check-out is written down on the phone with the moment it really
 * happened and the position the phone had then, and sent when the network allows; the screen shows it as done at once, marked as not
 * yet sent. The server judges the fix when it arrives, against the same rules this overlay uses to preview it.
 */
import type { SiteTimeView, SiteVisitView } from '@/data/repository';
import type { GeoPoint, SiteLeaveReason } from '@/data/types';
import { haversineKm } from '@/design-system/format';
import { OVERRIDE_REASON_MIN, readPresence } from '@/features/technician/presence';

export type SiteQueueItem = { id: string; jobId: string; capturedAt: string } & (
  | { kind: 'in'; location: GeoPoint | null; accuracyM: number | null; reason?: string }
  | { kind: 'out'; location?: GeoPoint | null; leaveReason?: SiteLeaveReason; note?: string }
  | { kind: 'late'; visitId: string; leftAt: string; note?: string }
);
export type SiteQueueInput = SiteQueueItem extends infer T ? (T extends unknown ? Omit<T, 'id' | 'jobId' | 'capturedAt'> : never) : never;

const minutesBetween = (a: string, b: string) => Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60_000));

/** Lays the changes not yet sent over what the server last said. */
export function applySiteQueue(view: SiteTimeView, queue: SiteQueueItem[], user: { id: string; name: string }): SiteTimeView {
  let mine: SiteVisitView | null = view.mine;
  let visits = [...view.visits];
  const team = view.team.map((p) => ({ ...p }));
  const person = () => team.find((p) => p.userId === user.id);
  for (const item of queue.filter((q) => q.jobId === view.job.id)) {
    if (item.kind === 'in') {
      if (mine) continue;
      const driftM = item.location ? Math.round(haversineKm(item.location, view.job.location) * 1000) : null;
      const read = readPresence({ driftM, accuracyM: item.accuracyM, radiusM: view.job.radiusM });
      if ((read.verdict === 'mismatch' || read.verdict === 'unverified') && (item.reason ?? '').trim().length < OVERRIDE_REASON_MIN) continue;
      mine = { id: `local-${item.id}`, userId: user.id, name: user.name, checkInAt: item.capturedAt, checkOutAt: null, minutes: 0, verdict: read.verdict, driftM, accuracyM: item.accuracyM, reason: item.reason?.trim() || null, kind: null, leave: null, stale: false, local: true };
      visits = [mine, ...visits];
      const p = person();
      if (p) {
        p.onSiteNow = true;
        p.since = item.capturedAt;
      }
    } else if (item.kind === 'out') {
      if (!mine || mine.stale) continue;
      const closed: SiteVisitView = { ...mine, checkOutAt: item.capturedAt, minutes: minutesBetween(mine.checkInAt, item.capturedAt), kind: 'manual', leave: item.leaveReason ? { reason: item.leaveReason, note: item.note ?? null, openSteps: view.openSteps.length } : null, local: true };
      visits = visits.map((v) => (v.id === mine?.id ? closed : v));
      const p = person();
      if (p) {
        p.onSiteNow = false;
        p.since = null;
        p.lastLeftAt = item.capturedAt;
        p.minutes += closed.minutes;
      }
      mine = null;
    } else if (item.kind === 'late') {
      if (!mine || mine.id !== item.visitId) continue;
      const closed: SiteVisitView = { ...mine, checkOutAt: item.leftAt, minutes: minutesBetween(mine.checkInAt, item.leftAt), kind: 'confirmed_late', stale: false, local: true };
      visits = visits.map((v) => (v.id === mine?.id ? closed : v));
      const p = person();
      if (p) {
        p.unconfirmed = false;
        p.minutes += closed.minutes;
      }
      mine = null;
    }
  }
  const problem = mine ? 'already_checked_in' : view.problem === 'already_checked_in' ? null : view.problem;
  return { ...view, mine, visits, team, problem };
}
