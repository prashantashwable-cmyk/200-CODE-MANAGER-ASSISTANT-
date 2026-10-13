import type { ProductionRecord, ProductionStage } from '@/data/types';

/**
 * Manufacturer production tracking (096), pure — the detail screen, the
 * heartbeat's stall detection and 095's per-line summary all read this.
 */

export const FULL_PRODUCTION_STAGES: ProductionStage[] = ['raw_material', 'fabrication', 'quality_testing', 'packaging', 'complete'];

/** Standard parts pulled from stock and tested — nothing is custom-built,
 *  so there's no fabrication stage to pretend to track. */
const STANDARD_PART_CATEGORIES = new Set(['ropes', 'wiring', 'vfd', 'brackets']);

export function stagesForCategory(category: string): ProductionStage[] {
  return STANDARD_PART_CATEGORIES.has(category)
    ? ['raw_material', 'quality_testing', 'packaging', 'complete']
    : [...FULL_PRODUCTION_STAGES];
}

/** A test certificate or photo must exist before quality testing can be
 *  signed off — the documentation trail AIEC's no-liability model rests on. */
export const EVIDENCE_REQUIRED_STAGES: ProductionStage[] = ['quality_testing'];

const DEFAULT_STAGE_DAYS: Record<Exclude<ProductionStage, 'complete'>, number> = {
  raw_material: 3,
  fabrication: 7,
  quality_testing: 2,
  packaging: 1,
};

/** Past this share of the manufacturer's own usual time, a stage is stalled. */
export const STALL_RATIO = 1.5;
const MIN_SAMPLES = 2;
const MIN_OBSERVED_DAYS = 0.25;
const DAY = 86_400_000;

export function completionPct(record: ProductionRecord): number {
  if (record.currentStage === 'complete') return 100;
  const working = record.stages.filter((s) => s !== 'complete');
  const index = working.indexOf(record.currentStage);
  return working.length === 0 ? 0 : Math.round((Math.max(0, index) / working.length) * 100);
}

/** The stage after `stage` in this record's own (possibly shortened) list. */
export function nextStage(record: ProductionRecord): ProductionStage | null {
  const index = record.stages.indexOf(record.currentStage);
  return index >= 0 && index < record.stages.length - 1 ? record.stages[index + 1] : null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * This manufacturer's usual time in a stage — from their own finished
 * stages (entered → advanced out of). Rework isn't a normal duration, and a
 * batch that moved together counts once.
 */
export function expectedStageDays(
  supplierId: string,
  stage: ProductionStage,
  records: ProductionRecord[],
): { days: number; isDefault: boolean } {
  if (stage === 'complete') return { days: 0, isDefault: false };
  const observed = new Map<string, number>();
  for (const record of records) {
    if (record.supplierId !== supplierId) continue;
    let enteredAt: string | null = record.stages[0] === stage ? record.startedAt : null;
    for (const e of record.events) {
      if (enteredAt && e.fromStage === stage && e.kind === 'advanced') {
        const duration = (new Date(e.at).getTime() - new Date(enteredAt).getTime()) / DAY;
        if (duration >= MIN_OBSERVED_DAYS) observed.set(`${record.batchId ?? record.id}|${enteredAt}|${e.at}`, duration);
        enteredAt = null;
      }
      if (e.toStage === stage) enteredAt = e.at;
    }
  }
  const durations = [...observed.values()];
  if (durations.length >= MIN_SAMPLES) return { days: Math.round(median(durations) * 10) / 10, isDefault: false };
  return { days: DEFAULT_STAGE_DAYS[stage], isDefault: true };
}

export interface StallAssessment {
  daysInStage: number;
  expectedDays: number;
  expectedIsDefault: boolean;
  stalled: boolean;
}

export function assessStall(record: ProductionRecord, records: ProductionRecord[], now: number): StallAssessment {
  const daysInStage = Math.max(0, (now - new Date(record.stageEnteredAt).getTime()) / DAY);
  const expected = expectedStageDays(record.supplierId, record.currentStage, records);
  return {
    daysInStage: Math.round(daysInStage * 10) / 10,
    expectedDays: expected.days,
    expectedIsDefault: expected.isDefault,
    stalled: record.currentStage !== 'complete' && daysInStage > expected.days * STALL_RATIO,
  };
}
