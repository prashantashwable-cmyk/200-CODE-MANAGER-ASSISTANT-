/** Screen 121 — Technician Home / My Jobs. Types and translation keys only. */

import type { Job } from '@/data/types';
import type { TechnicianJobActionView } from '@/data/repository';

export type TechnicianHomeStatus = 'loading' | 'ready' | 'error';

/** How often the day re-reads while open: a delivery landing or a hold can change what a technician should do next. */
export const POLL_MS = 30_000;
export const LAST_SYNC_KEY = 'aiec.technicianLastSyncedAt';

export const ACTIONS: TechnicianJobActionView[] = ['start', 'continue', 'waiting_materials', 'on_hold', 'review'];
export const STATUSES: Job['status'][] = ['scheduled', 'materials_pending', 'in_progress', 'qc_pending', 'handover_pending', 'completed', 'on_hold'];
export const STEP_STATUSES = ['complete', 'current', 'upcoming', 'blocked'] as const;

/** Where a job opens: Job Detail (122), the next screen in this module. */
export const jobPath = (id: string) => `/technician/jobs/${id}`;

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const HOME_KEYS = {
  title: 'technicianHome.title',
  greeting: 'technicianHome.greeting',
  loading: 'technicianHome.loading',
  onDuty: 'technicianHome.onDuty',
  offDuty: 'technicianHome.offDuty',
  offlineNote: 'technicianHome.offlineNote',
  lastSynced: 'technicianHome.lastSynced',
  error: { title: 'technicianHome.error.title', body: 'technicianHome.error.body' },
  clash: { title: 'technicianHome.clash.title', body: 'technicianHome.clash.body' },
  checkIn: { staleTitle: 'technicianHome.checkIn.staleTitle', staleBody: 'technicianHome.checkIn.staleBody', staleAction: 'technicianHome.checkIn.staleAction', onSite: 'technicianHome.checkIn.onSite', open: 'technicianHome.checkIn.open' },
  today: {
    heading: 'technicianHome.today.heading',
    emptyTitle: 'technicianHome.today.emptyTitle',
    emptyBody: 'technicianHome.today.emptyBody',
    nextUp: 'technicianHome.today.nextUp',
    customer: 'technicianHome.today.customer',
    startedOn: 'technicianHome.today.startedOn',
    scheduledFor: 'technicianHome.today.scheduledFor',
  },
  role: {
    lead: 'technicianHome.role.lead',
    assistant: 'technicianHome.role.assistant',
    assisting: 'technicianHome.role.assisting',
    yourPart: 'technicianHome.role.yourPart',
    withTeam: 'technicianHome.role.withTeam',
    partDone: 'technicianHome.role.partDone',
  },
  status: rec('technicianHome.status', STATUSES),
  stepStatus: rec('technicianHome.stepStatus', STEP_STATUSES),
  stage: { label: 'technicianHome.stage.label', done: 'technicianHome.stage.done', progress: 'technicianHome.stage.progress' },
  action: { ...rec('technicianHome.action', ACTIONS), openMine: 'technicianHome.action.openMine' },
  hold: { reason: 'technicianHome.hold.reason' },
  upcoming: {
    heading: 'technicianHome.upcoming.heading',
    empty: 'technicianHome.upcoming.empty',
    waiting: 'technicianHome.upcoming.waiting',
    clash: 'technicianHome.upcoming.clash',
    assisting: 'technicianHome.upcoming.assisting',
  },
  stat: {
    completed: 'technicianHome.stat.completed',
    quality: 'technicianHome.stat.quality',
    qualityNone: 'technicianHome.stat.qualityNone',
    qualityHint: 'technicianHome.stat.qualityHint',
    payout: 'technicianHome.stat.payout',
    payoutCount: 'technicianHome.stat.payoutCount',
    payoutNone: 'technicianHome.stat.payoutNone',
  },
  firstDay: { title: 'technicianHome.firstDay.title', body: 'technicianHome.firstDay.body' },
} as const;
