import type { Alert, AlertSeverity } from '@/data/types';

/**
 * The one way anything in the app says "a human needs to look at this".
 * Each domain screen keeps its own rich record (a dispute, a discount
 * request, an overdue payment); an Alert is the lightweight beacon pointing
 * back at it, so the Alerts board, the escalation screen and the future
 * single-person control panel all read one list instead of many.
 *
 * Pure builders only — the mutable `alerts` store and the `raiseAlert()`
 * wrapper that writes to it stay inside memoryRepository.ts.
 */
export interface AttentionAlertInput {
  titleKey: string;
  context: string;
  severity: AlertSeverity;
  category: Alert['category'];
  relatedId?: string;
  sourceRoute?: string;
  location?: Alert['location'];
}

/** An unresolved alert for the same (relatedId, titleKey) is the same
 *  underlying problem — raising it again must never duplicate it. */
export function findOpenAlertFor(existing: Alert[], input: Pick<AttentionAlertInput, 'relatedId' | 'titleKey'>): Alert | undefined {
  return existing.find((a) => a.relatedId === input.relatedId && a.titleKey === input.titleKey && a.status !== 'resolved');
}

export function buildAlert(input: AttentionAlertInput, id: string, code: string, now: string): Alert {
  return { id, code, status: 'open', raisedAt: now, isDemo: true, ...input };
}
