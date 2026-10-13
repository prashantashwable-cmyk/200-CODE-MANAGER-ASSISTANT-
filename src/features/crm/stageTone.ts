import type { LeadStage } from '@/data/types';
import type { BadgeTone } from '@/design-system';

/**
 * One stage → colour mapping, shared by every CRM screen (list, Kanban,
 * detail, funnel). The spec is explicit that the master list and the Kanban
 * board render from the same records and must read as one system — this is
 * the piece that keeps their colours from drifting apart as separate screens
 * are built independently.
 */
export const STAGE_TONE: Record<LeadStage, BadgeTone> = {
  captured: 'neutral',
  contacted: 'accent',
  site_visit: 'accent',
  quoted: 'emerald',
  negotiation: 'warning',
  won: 'success',
  lost: 'error',
};

export const PIPELINE_STAGES: LeadStage[] = [
  'captured',
  'contacted',
  'site_visit',
  'quoted',
  'negotiation',
  'won',
  'lost',
];

/** Stages a card can still move between on the Kanban board — lost is a
 *  terminal state reached through disqualification (screen 049), not a drag. */
export const KANBAN_COLUMNS: LeadStage[] = [
  'captured',
  'contacted',
  'site_visit',
  'quoted',
  'negotiation',
  'won',
];

/** How long a lead may sit in a stage before a card is considered stalled. */
export const HEALTHY_STAGE_DAYS: Partial<Record<LeadStage, number>> = {
  captured: 2,
  contacted: 3,
  site_visit: 5,
  quoted: 5,
  negotiation: 7,
};

export function isStale(stage: LeadStage, daysInStage: number): boolean {
  const threshold = HEALTHY_STAGE_DAYS[stage];
  return threshold !== undefined && daysInStage > threshold;
}
