/** Screen 034 — Building Specification Capture. Types and translation keys only. */

import type { BuildingSpec } from '@/data/types';

export type UsageType = 'residential' | 'commercial' | 'institutional' | 'mixed';

export const USAGE_TYPES: UsageType[] = ['residential', 'commercial', 'institutional', 'mixed'];

export type ConstructionStage = BuildingSpec['constructionStage'];

export const CONSTRUCTION_STAGES: ConstructionStage[] = ['foundation', 'structure', 'finishing', 'ready'];

/** kg per passenger — the standard Indian passenger-lift design figure. */
export const KG_PER_PERSON = 68;

/**
 * A typical starting-point capacity by usage and floor count. Editable —
 * this is a helper suggestion, never a constraint.
 */
export function suggestCapacity(usage: UsageType, floors: number): number {
  if (usage === 'commercial' || usage === 'institutional') {
    if (floors >= 12) return 13;
    if (floors >= 7) return 10;
    return 8;
  }
  if (floors >= 14) return 10;
  if (floors >= 8) return 8;
  return 6;
}

/** Beyond this floor count, the standard auto-quotation path does not apply. */
export const SPECIALIZED_QUOTE_FLOOR_THRESHOLD = 20;

export const CAPTURE_SPEC_KEYS = {
  title: 'captureSpec.title',
  subtitle: 'captureSpec.subtitle',
  field: {
    floors: 'captureSpec.field.floors',
    basements: 'captureSpec.field.basements',
    usage: 'captureSpec.field.usage',
    stage: 'captureSpec.field.stage',
    capacity: 'captureSpec.field.capacity',
    capacityHint: 'captureSpec.field.capacityHint',
    speed: 'captureSpec.field.speed',
    shaftWidth: 'captureSpec.field.shaftWidth',
    shaftDepth: 'captureSpec.field.shaftDepth',
    shaftNotVisible: 'captureSpec.field.shaftNotVisible',
    notes: 'captureSpec.field.notes',
    notesHint: 'captureSpec.field.notesHint',
    mixedUseToggle: 'captureSpec.field.mixedUseToggle',
  },
  usage: {
    residential: 'captureSpec.usage.residential',
    commercial: 'captureSpec.usage.commercial',
    institutional: 'captureSpec.usage.institutional',
    mixed: 'captureSpec.usage.mixed',
  },
  stage: {
    foundation: 'captureSpec.stage.foundation',
    structure: 'captureSpec.stage.structure',
    finishing: 'captureSpec.stage.finishing',
    ready: 'captureSpec.stage.ready',
  },
  stageNote: 'captureSpec.stageNote',
  estimateNote: 'captureSpec.estimateNote',
  specializedFlag: 'captureSpec.specializedFlag',
  requiredNote: 'captureSpec.requiredNote',
  invalid: {
    floors: 'captureSpec.invalid.floors',
    capacity: 'captureSpec.invalid.capacity',
  },
} as const;
