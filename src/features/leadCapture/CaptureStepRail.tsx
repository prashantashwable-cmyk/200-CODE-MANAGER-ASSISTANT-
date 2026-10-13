import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AscensionLine } from '@/design-system';
import type { AscensionStep, AscensionStepStatus } from '@/design-system';
import { useCaptureDraft } from './CaptureDraftProvider';

/**
 * The five-step rail shown at the top of every lead-capture screen
 * (032 → 036). One definition shared across five separate routes, so the
 * step order and labels can never drift between them.
 */
const STEPS: Array<{ id: string; labelKey: string; path: string }> = [
  { id: 'location', labelKey: 'captureGps.step.location', path: '/surveyor/capture' },
  { id: 'contact', labelKey: 'captureGps.step.contact', path: '/surveyor/capture/contact' },
  { id: 'spec', labelKey: 'captureGps.step.spec', path: '/surveyor/capture/spec' },
  { id: 'duplicate', labelKey: 'captureGps.step.duplicate', path: '/surveyor/capture/duplicate' },
  { id: 'confirm', labelKey: 'captureGps.step.confirm', path: '/surveyor/capture/confirm' },
];

export function CaptureStepRail({ current }: { current: 'location' | 'contact' | 'spec' | 'duplicate' | 'confirm' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { progress } = useCaptureDraft();

  const completedFlags: Record<string, boolean> = {
    location: progress.location,
    contact: progress.contact,
    spec: progress.spec,
    duplicate: progress.duplicateChecked,
    confirm: false,
  };

  const currentIndex = STEPS.findIndex((s) => s.id === current);

  const steps: AscensionStep[] = STEPS.map((step, index) => {
    let status: AscensionStepStatus;
    if (index === currentIndex) status = 'current';
    else if (completedFlags[step.id]) status = 'complete';
    else status = 'upcoming';

    return {
      id: step.id,
      label: t(step.labelKey),
      status,
      // Only completed earlier steps are safe to jump back to.
      onClick: index < currentIndex && completedFlags[step.id] ? () => navigate(step.path) : undefined,
    };
  });

  return (
    <div className="ds-card mb-4">
      <AscensionLine steps={steps} orientation="horizontal" />
    </div>
  );
}
