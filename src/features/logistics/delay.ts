import type { DelayImpact, DelaySeverity } from '@/data/types';
import { hours } from '@/features/sla/clock';

/**
 * Screen 105's judgement of a delivery, pure and computed on read: never
 * stored, so a supplier catching up clears it the moment they do. What it
 * holds a delivery to is the booked window (101) once there is one, else the
 * date promised. What it compares that against is the live tracker's ETA
 * (102) once a vehicle is on the road, else the stage-by-stage estimate (095).
 */

/** A delay this long, days, is critical whatever else is true. */
export const CRITICAL_GAP = hours(72);
/** Arriving within this of the deadline counts as trending late. */
export const TIGHT_MARGIN = hours(2);
/** Parts arriving within this many days before the install starts leave no slack. */
export const INSTALL_SLACK_DAYS = 2;

export interface DelayFacts {
  /** What we are held to. Null when nothing was ever promised. */
  expectedAt: string | null;
  expectedSource: 'booked' | 'promised';
  currentEta: string;
  etaSource: 'tracker' | 'estimate';
  /** A dropped feed, or a manual vehicle that has gone quiet: the ETA is a guess. */
  uncertain: boolean;
  /** 095's own read that the stage is dragging or the projection overshoots. */
  estimateAtRisk: boolean;
  /** When the deal's installation is due to start, if a job is waiting on these parts. */
  installStart: string | null;
}

export interface DelayVerdict {
  gapHours: number | null;
  severity: DelaySeverity | null;
  impact: DelayImpact;
}

const ms = (iso: string) => new Date(iso).getTime();

export function impactOf(etaMs: number, installStart: string | null): DelayImpact {
  if (!installStart) return 'none';
  const start = ms(installStart);
  if (etaMs >= start) return 'blocks_install';
  return etaMs >= start - INSTALL_SLACK_DAYS * 86_400_000 ? 'tight' : 'flexible';
}

export function judgeDelay(f: DelayFacts, now: number): DelayVerdict {
  // An ETA already in the past with nothing arrived is a guess that has failed: it is at least now.
  const eta = Math.max(ms(f.currentEta), now);
  const impact = impactOf(eta, f.installStart);
  if (!f.expectedAt) return { gapHours: null, severity: null, impact };
  const gap = eta - ms(f.expectedAt);
  const gapHours = Math.round(gap / 3_600_000);
  if (gap > 0) {
    // A guess from typical stage times is not a broken promise: only a tracker's ETA, or a
    // deadline that has actually passed, is. Until then it is a watch, however far off it looks.
    const factual = f.etaSource === 'tracker' || now > ms(f.expectedAt);
    if (!factual) return { gapHours, severity: 'watch', impact };
    const critical = impact === 'blocks_install' || gap > CRITICAL_GAP;
    return { gapHours, severity: critical ? 'critical' : 'late', impact };
  }
  const trending = f.estimateAtRisk || f.uncertain || -gap <= TIGHT_MARGIN;
  return { gapHours, severity: trending ? 'watch' : null, impact };
}

const SEVERITY_RANK: Record<DelaySeverity, number> = { critical: 3, late: 2, watch: 1 };
const IMPACT_RANK: Record<DelayImpact, number> = { blocks_install: 3, tight: 2, flexible: 1, none: 0 };

/** Most customer-impactful first: severity, then what it does to the install, then how far, then how big the deal. */
export function compareDelays(
  a: { severity: DelaySeverity; impact: DelayImpact; gapHours: number | null; dealValue: number },
  b: { severity: DelaySeverity; impact: DelayImpact; gapHours: number | null; dealValue: number },
): number {
  return (
    SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
    IMPACT_RANK[b.impact] - IMPACT_RANK[a.impact] ||
    (b.gapHours ?? -Infinity) - (a.gapHours ?? -Infinity) ||
    b.dealValue - a.dealValue
  );
}

/** Whether a customer told about an ETA should hear again: it has moved by half a day or more. */
export function etaMovedSince(toldEta: string | undefined, currentEta: string): boolean {
  if (!toldEta) return false;
  return Math.abs(ms(currentEta) - ms(toldEta)) >= hours(12);
}
