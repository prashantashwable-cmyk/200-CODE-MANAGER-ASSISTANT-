/** Screen 114 — Supplier Payment Schedule. Types and translation keys only. */

import type { ChainNodeKind } from '@/features/suppliers/paymentChain';
import type { ScheduleState } from '@/features/suppliers/paymentSchedule';
import type { SupplierPaymentPart } from '@/data/types';
import type { CalendarMode } from '@/features/calendar/calendarMath';

export type PaymentScheduleStatus = 'loading' | 'ready' | 'error';

/** How often the schedule re-reads while open: it moves whenever a real milestone does. */
export const POLL_MS = 30_000;

export type PartFilter = 'all' | SupplierPaymentPart;
export const PART_FILTERS: PartFilter[] = ['all', 'upfront', 'balance', 'retention'];
export const SCHEDULE_STATES: ScheduleState[] = ['expected', 'owed', 'waiting', 'held', 'approved'];
export const WAITING_ON: ChainNodeKind[] = ['acknowledged', 'delivery_confirmed', 'net_period', 'retention_release'];
export const VIEW_MODES: CalendarMode[] = ['agenda', 'week', 'month'];

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;

export const SCHEDULE_KEYS = {
  title: 'supplierPaymentSchedule.title',
  subtitle: 'supplierPaymentSchedule.subtitle',
  loading: 'supplierPaymentSchedule.loading',
  error: { title: 'supplierPaymentSchedule.error.title', body: 'supplierPaymentSchedule.error.body' },
  empty: { title: 'supplierPaymentSchedule.empty.title', body: 'supplierPaymentSchedule.empty.body' },
  noMatch: { title: 'supplierPaymentSchedule.noMatch.title', body: 'supplierPaymentSchedule.noMatch.body', clear: 'supplierPaymentSchedule.noMatch.clear' },
  totals: {
    owedNow: 'supplierPaymentSchedule.totals.owedNow',
    next7: 'supplierPaymentSchedule.totals.next7',
    next30: 'supplierPaymentSchedule.totals.next30',
    later: 'supplierPaymentSchedule.totals.later',
    count: 'supplierPaymentSchedule.totals.count',
    filtered: 'supplierPaymentSchedule.totals.filtered',
    includesOwed: 'supplierPaymentSchedule.totals.includesOwed',
  },
  filter: {
    label: 'supplierPaymentSchedule.filter.label',
    supplier: 'supplierPaymentSchedule.filter.supplier',
    allSuppliers: 'supplierPaymentSchedule.filter.allSuppliers',
    type: 'supplierPaymentSchedule.filter.type',
    all: 'supplierPaymentSchedule.filter.all',
    upfront: 'supplierPaymentSchedule.filter.upfront',
    balance: 'supplierPaymentSchedule.filter.balance',
    retention: 'supplierPaymentSchedule.filter.retention',
  },
  part: rec('supplierPaymentSchedule.part', ['upfront', 'balance', 'retention'] as const),
  state: rec('supplierPaymentSchedule.state', SCHEDULE_STATES),
  waitingOn: rec('supplierPaymentSchedule.waitingOn', WAITING_ON),
  flow: {
    heading: 'supplierPaymentSchedule.flow.heading',
    hint: 'supplierPaymentSchedule.flow.hint',
    by: 'supplierPaymentSchedule.flow.by',
    week: 'supplierPaymentSchedule.flow.week',
    month: 'supplierPaymentSchedule.flow.month',
    owedNow: 'supplierPaymentSchedule.flow.owedNow',
    beyond: 'supplierPaymentSchedule.flow.beyond',
    running: 'supplierPaymentSchedule.flow.running',
    heavy: 'supplierPaymentSchedule.flow.heavy',
    heavyBody: 'supplierPaymentSchedule.flow.heavyBody',
    heavyWeek: 'supplierPaymentSchedule.flow.heavyWeek',
    undated: 'supplierPaymentSchedule.flow.undated',
    undatedBody: 'supplierPaymentSchedule.flow.undatedBody',
  },
  view: { label: 'supplierPaymentSchedule.view.label', agenda: 'supplierPaymentSchedule.view.agenda', week: 'supplierPaymentSchedule.view.week', month: 'supplierPaymentSchedule.view.month' },
  legend: {
    heading: 'supplierPaymentSchedule.legend.heading',
    expected: 'supplierPaymentSchedule.legend.expected',
    owed: 'supplierPaymentSchedule.legend.owed',
    held: 'supplierPaymentSchedule.legend.held',
    approved: 'supplierPaymentSchedule.legend.approved',
  },
  day: { empty: 'supplierPaymentSchedule.day.empty', emptyBody: 'supplierPaymentSchedule.day.emptyBody', total: 'supplierPaymentSchedule.day.total' },
  item: {
    expectedOn: 'supplierPaymentSchedule.item.expectedOn',
    owedSince: 'supplierPaymentSchedule.item.owedSince',
    overdue: 'supplierPaymentSchedule.item.overdue',
    slipped: 'supplierPaymentSchedule.item.slipped',
    plannedWas: 'supplierPaymentSchedule.item.plannedWas',
    undated: 'supplierPaymentSchedule.item.undated',
    waitsFor: 'supplierPaymentSchedule.item.waitsFor',
    release: 'supplierPaymentSchedule.item.release',
    approvals: 'supplierPaymentSchedule.item.approvals',
    invoice: 'supplierPaymentSchedule.item.invoice',
    orphaned: 'supplierPaymentSchedule.item.orphaned',
    earlyRelease: 'supplierPaymentSchedule.item.earlyRelease',
  },
  dropped: {
    heading: 'supplierPaymentSchedule.dropped.heading',
    body: 'supplierPaymentSchedule.dropped.body',
    row: 'supplierPaymentSchedule.dropped.row',
  },
} as const;
