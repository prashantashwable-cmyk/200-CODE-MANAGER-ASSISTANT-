import { useState } from 'react';
import type { SopWorkState } from '@/features/technician/useSopWork';
import { useSopWork } from '@/features/technician/useSopWork';

export type { FailedChange } from '@/features/technician/useSopWork';
export type InstallationSopState = ReturnType<typeof useInstallationSopChecklist>;

/**
 * Owns one job's checklist. The work itself (the phone-first queue, sending, refusals) is shared with evidence capture (124) in
 * `useSopWork`; this adds only which step is open on screen.
 */
export function useInstallationSopChecklist() {
  const work: SopWorkState = useSopWork();
  const [selected, setSelected] = useState<string | null>(null);
  const view = work.view;
  const currentId = view?.currentStepId ?? null;
  const shownId = selected && view?.steps.some((s) => s.id === selected) ? selected : currentId;
  const focus = (stepId: string) => {
    work.focusStep(stepId);
    setSelected(stepId);
  };
  return { ...work, selectedId: shownId, select: setSelected, focus };
}
