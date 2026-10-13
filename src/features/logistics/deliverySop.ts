import type { DeliverySopStep, DeliverySopTemplate, DeliverySopVersion, SopVersionRef } from '@/data/types';

/**
 * Screen 107's procedure logic, pure — the one place that says which steps a
 * technician meets for a part. Nothing about a delivery checklist's steps is
 * hardcoded anywhere else. Read by the SOP screen (to preview), by the
 * repository (to pin a checklist to what applied when it started) and by 103.
 */

/** The master template that every part follows. */
export const MASTER_CATEGORY = 'all';

export type SopVersionStatus = 'active' | 'scheduled' | 'retired';

const ms = (iso: string) => new Date(iso).getTime();

/** The version of one template that governs a checklist started at `at`. */
export function versionInForce(template: DeliverySopTemplate | undefined, at: number): DeliverySopVersion | null {
  if (!template) return null;
  return [...template.versions].filter((v) => ms(v.effectiveFrom) <= at).sort((a, b) => b.version - a.version)[0] ?? null;
}

export function statusOf(template: DeliverySopTemplate, version: DeliverySopVersion, now: number): SopVersionStatus {
  if (ms(version.effectiveFrom) > now) return 'scheduled';
  return versionInForce(template, now)?.id === version.id ? 'active' : 'retired';
}

export interface ResolvedSteps {
  steps: (DeliverySopStep & { source: 'all' | 'category' })[];
  versions: SopVersionRef[];
}

/** The master steps first, then this category's own: a glass cabin's extra fragility check sits after
 *  the checks every part gets, never instead of them. */
export function resolveSopSteps(templates: DeliverySopTemplate[], category: string, at: number): ResolvedSteps {
  const out: ResolvedSteps = { steps: [], versions: [] };
  for (const cat of category === MASTER_CATEGORY ? [MASTER_CATEGORY] : [MASTER_CATEGORY, category]) {
    const template = templates.find((t) => t.category === cat);
    const version = versionInForce(template, at);
    if (!template || !version) continue;
    out.versions.push({ templateId: template.id, versionId: version.id, version: version.version, category: cat });
    for (const step of version.steps) out.steps.push({ ...step, source: cat === MASTER_CATEGORY ? 'all' : 'category' });
  }
  return out;
}

/** The label and hint in the reader's language, English when a translation was never written. */
export function stepText(step: DeliverySopStep, lang: string): { label: string; hint?: string } {
  const label = (lang === 'hi' ? step.labelHi : lang === 'mr' ? step.labelMr : undefined) || step.label;
  const hint = (lang === 'hi' ? step.hintHi : lang === 'mr' ? step.hintMr : undefined) || step.hint;
  return { label, hint };
}

export type SopIssue = 'label_short' | 'duplicate_label' | 'no_steps';

/** What is wrong with a draft list of steps, if anything. */
export function checkSteps(steps: Pick<DeliverySopStep, 'label'>[], requireAtLeastOne = true): SopIssue[] {
  const issues: SopIssue[] = [];
  if (requireAtLeastOne && steps.length === 0) issues.push('no_steps');
  if (steps.some((s) => s.label.trim().length < 3)) issues.push('label_short');
  const seen = new Set<string>();
  for (const s of steps) {
    const key = s.label.trim().toLowerCase();
    if (key && seen.has(key)) {
      issues.push('duplicate_label');
      break;
    }
    seen.add(key);
  }
  return issues;
}

export type SopProblem = 'sop_step' | 'sop_photo';

/** The first mandatory step not yet ticked, or a ticked photo step with no photograph. */
/** What has been answered: a step's photograph only needs to exist, whatever shape it has. */
export interface SopAnswer {
  stepId: string;
  done: boolean;
  photo?: unknown;
}

export function sopProblem(steps: DeliverySopStep[] | undefined, results: SopAnswer[] | undefined): SopProblem | null {
  for (const step of steps ?? []) {
    const r = results?.find((x) => x.stepId === step.id);
    if (step.mandatory && !r?.done) return 'sop_step';
    if (r?.done && step.needsPhoto && !r.photo) return 'sop_photo';
  }
  return null;
}

/** Steps present now that the reader had not seen: the ones to point out after a procedure changes. */
export function newSteps(current: DeliverySopStep[], seenStepIds: string[]): DeliverySopStep[] {
  return current.filter((s) => !seenStepIds.includes(s.id));
}
