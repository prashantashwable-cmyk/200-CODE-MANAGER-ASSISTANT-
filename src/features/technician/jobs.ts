/**
 * The technician's day, pure (121). The job list is never a calendar of its own: it is the same `Job` records the delivery
 * scheduling trigger creates and moves (101), read for one person. What lives here is only how to say "today", "upcoming", "whose
 * part is this" and "these two clash", once.
 */
import type { Job, JobStatus } from '@/data/types';

const DAY = 86_400_000;

/** How far ahead "coming up" looks. */
export const UPCOMING_DAYS = 14;
/** A sent SOS is followed on the phone for this long, so the person can see that it was seen. */
export const SOS_FOLLOW = 4 * 3_600_000;

/** Started, and not finished or waiting on someone else: it is on the technician's plate today whatever its booked date was. */
const ACTIVE: JobStatus[] = ['in_progress', 'qc_pending', 'handover_pending', 'on_hold'];
/** Not started yet, so its booked day is the day that counts. */
const NOT_STARTED: JobStatus[] = ['scheduled', 'materials_pending'];

export const isActiveJob = (j: Pick<Job, 'status'>) => ACTIVE.includes(j.status);
export const isNotStarted = (j: Pick<Job, 'status'>) => NOT_STARTED.includes(j.status);

/** `yyyy-mm-dd` in the phone's own calendar. */
export const dayKey = (iso: string | number): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Everyone who is on the job: the lead, plus the crew the job names. */
export const peopleOn = (j: Pick<Job, 'technicianId' | 'crew'>): string[] => {
  const ids = new Set<string>();
  if (j.technicianId) ids.add(j.technicianId);
  for (const c of j.crew ?? []) ids.add(c.userId);
  return [...ids];
};

export const isOnJob = (j: Pick<Job, 'technicianId' | 'crew'>, userId: string): boolean => peopleOn(j).includes(userId);

export type JobRole = 'lead' | 'assistant';

/** Whether a lead's delegation is in force today, on the site's calendar: from its first day to the end of its last, and not withdrawn. */
export const delegationActive = (d: Job['leadDelegation'], now = Date.now()): boolean => {
  if (!d || d.revokedAt) return false;
  const from = new Date(`${d.from}T00:00:00`).getTime();
  const until = new Date(`${d.until}T23:59:59`).getTime();
  return now >= from && now <= until;
};

type Crewed = Pick<Job, 'technicianId' | 'crew'> & Partial<Pick<Job, 'leadDelegation'>>;

/** Everyone who holds the lead's authority right now: the lead, and whoever the lead's authority was handed to for these days. */
export const leadIdsOf = (j: Crewed, now = Date.now()): string[] => [...(j.technicianId ? [j.technicianId] : []), ...(delegationActive(j.leadDelegation, now) && j.leadDelegation ? [j.leadDelegation.toUserId] : [])];

/** The lead answers for the whole job. Anyone else the job names is an assistant with their own steps. */
export const roleOf = (j: Crewed, userId: string): JobRole | null => {
  if (leadIdsOf(j).includes(userId)) return 'lead';
  return (j.crew ?? []).some((c) => c.userId === userId) ? 'assistant' : null;
};

/** The steps that are this person's own, or null for the lead, who sees them all. */
export const ownStepIds = (j: Crewed, userId: string): string[] | null => {
  if (roleOf(j, userId) !== 'assistant') return null;
  return (j.crew ?? []).find((c) => c.userId === userId)?.stepIds ?? [];
};

export type TodayBucket = 'today' | 'upcoming' | 'later' | 'done';

/** Where a job sits in this person's week. */
export function bucketOf(j: Pick<Job, 'status' | 'scheduledFor'>, now: number): TodayBucket {
  if (j.status === 'completed') return 'done';
  if (isActiveJob(j)) return 'today';
  const day = dayKey(j.scheduledFor);
  const today = dayKey(now);
  if (day <= today) return 'today';
  return new Date(j.scheduledFor).getTime() - now <= UPCOMING_DAYS * DAY ? 'upcoming' : 'later';
}

export type JobAction = 'start' | 'continue' | 'waiting_materials' | 'on_hold' | 'review';

/** What the one big button says. A job cannot be started while its parts are still coming or while it is held. */
export function actionOf(status: JobStatus): JobAction {
  switch (status) {
    case 'in_progress':
      return 'continue';
    case 'scheduled':
      return 'start';
    case 'materials_pending':
      return 'waiting_materials';
    case 'on_hold':
      return 'on_hold';
    default:
      return 'review';
  }
}

export interface Clash {
  /** `yyyy-mm-dd` */
  date: string;
  jobIds: string[];
}

/** Two jobs booked to start on the same day for the same person cannot both happen. The assignment logic should have kept them
 *  apart; if one got through it is said plainly here rather than drawn as an impossible day. */
export function clashesOf(jobs: Pick<Job, 'id' | 'status' | 'scheduledFor'>[]): Clash[] {
  const byDay = new Map<string, string[]>();
  for (const j of jobs) {
    if (!isNotStarted(j)) continue;
    const key = dayKey(j.scheduledFor);
    byDay.set(key, [...(byDay.get(key) ?? []), j.id]);
  }
  return [...byDay.entries()].filter(([, ids]) => ids.length > 1).map(([date, jobIds]) => ({ date, jobIds }));
}

export const sameMonth = (iso: string, now: number): boolean => {
  const a = new Date(iso);
  const b = new Date(now);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
};
