/** Screen 029 — Alerts & Exceptions Dashboard. Types and translation keys only. */

import type { Alert, AlertSeverity } from '@/data/types';

export type BoardStatus = 'loading' | 'ready' | 'empty' | 'error';

export type AgeFilter = 'all' | '24h' | '7d';

export const AGE_FILTERS: AgeFilter[] = ['all', '24h', '7d'];

/** The deliberate single home for everything automation could not fully
 *  resolve — this is the whole point of the "one person monitors" model. */
export interface ExceptionRow {
  alert: Alert;
  ageHours: number;
  /** Set when a second alert on this screen points at the same underlying
   *  record, so they read as linked rather than unrelated duplicates. */
  relatedIds: string[];
}

export const SEVERITY_ORDER: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];

export const ALERTS_BOARD_KEYS = {
  title: 'alertsBoard.title',
  subtitle: 'alertsBoard.subtitle',
  loading: 'alertsBoard.loading',
  statusFilter: { open: 'alertsBoard.statusFilter.open', resolved: 'alertsBoard.statusFilter.resolved' },
  ageFilter: { all: 'alertsBoard.ageFilter.all', '24h': 'alertsBoard.ageFilter.24h', '7d': 'alertsBoard.ageFilter.7d' },
  category: {
    safety: 'alertsBoard.category.safety',
    sla_breach: 'alertsBoard.category.sla_breach',
    payment: 'alertsBoard.category.payment',
    automation: 'alertsBoard.category.automation',
    quality: 'alertsBoard.category.quality',
    staffing: 'alertsBoard.category.staffing',
    supplier: 'alertsBoard.category.supplier',
  },
  ageHours: 'alertsBoard.ageHours',
  related: 'alertsBoard.related',
  bulkAcknowledge: 'alertsBoard.bulkAcknowledge',
  bulkAcknowledged: 'alertsBoard.bulkAcknowledged',
  snooze: 'alertsBoard.snooze',
  snoozed: 'alertsBoard.snoozed',
  delegate: 'alertsBoard.delegate',
  delegateTo: 'alertsBoard.delegateTo',
  delegated: 'alertsBoard.delegated',
  delegatePick: 'alertsBoard.delegatePick',
  delegateNote: 'alertsBoard.delegateNote',
  actionFailed: 'alertsBoard.actionFailed',
  resolvedElsewhere: 'alertsBoard.resolvedElsewhere',
  criticalFirst: 'alertsBoard.criticalFirst',
  liveLinkNote: 'alertsBoard.liveLinkNote',
  openInto: 'alertsBoard.openInto',
  empty: { title: 'alertsBoard.empty.title', body: 'alertsBoard.empty.body' },
  error: { title: 'alertsBoard.error.title', body: 'alertsBoard.error.body' },
} as const;
