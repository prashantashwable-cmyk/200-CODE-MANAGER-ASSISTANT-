import type { DeliveryDiscrepancyReport, ReportResolution } from '@/data/types';
import type { ReportImpactLevel } from '@/data/repository';

/**
 * Screen 108's report rules, pure. One report drives three consequences (the
 * supplier's accountability, its commercial consequence, the customer's
 * experience), so what "unresolved" and "affects the installation" mean is
 * written once here and read by everything that cares.
 */

export const RESOLUTION_ORDER: ReportResolution[] = ['reported', 'replacement_requested', 'replacement_shipped', 'resolved', 'credited'];
export const resolutionIndex = (r: ReportResolution) => RESOLUTION_ORDER.indexOf(r);

/** A report ends when the part is replaced and fine, or the money is back. */
export const isClosedResolution = (r: ReportResolution) => r === 'resolved' || r === 'credited';

/** Forward only, and `resolved` and `credited` are alternative ends: neither leads to the other. */
export function canMoveTo(from: ReportResolution, to: ReportResolution): boolean {
  if (isClosedResolution(from)) return false;
  if (isClosedResolution(to)) return true;
  return resolutionIndex(to) > resolutionIndex(from);
}

const DAY = 86_400_000;
/** A replacement arriving within this long before the installation starts leaves no slack. */
export const REPLACEMENT_SLACK_DAYS = 2;

/** What waiting for a replacement does to the installation, from dates alone. */
export function impactLevel(installStart: string | null, replacementEta: string | null): ReportImpactLevel {
  if (!installStart) return 'none';
  if (!replacementEta) return 'unknown';
  const eta = new Date(replacementEta).getTime();
  const start = new Date(installStart).getTime();
  if (eta > start) return 'blocks';
  return eta >= start - REPLACEMENT_SLACK_DAYS * DAY ? 'tight' : 'ok';
}

/** Lines whose payment should wait: any part named in a report that is not yet resolved. The supplier
 *  payment screens (Module 12) read this so an unresolved defect holds the money for that line. */
export function heldLineIds(reports: DeliveryDiscrepancyReport[], poId: string): string[] {
  return reports.filter((r) => r.poId === poId && r.status === 'open').flatMap((r) => r.items.map((i) => i.lineItemId));
}
