import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  ActionBar,
  AscensionLine,
  Button,
  Card,
  ScreenHeader,
} from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { WizardStatus, WizardStepDef } from './useWizard';

/**
 * The chrome every partner onboarding wizard shares: the Ascension Line step
 * rail (each completed step lights like a passed floor), the resume notice, the
 * sticky footer, and the submitted / failed outcomes.
 *
 * Each wizard supplies only its current step's fields as `children`.
 */
interface WizardShellProps<TDraft> {
  title: string;
  subtitle: string;
  steps: WizardStepDef<TDraft>[];
  stepStatuses: AscensionStep['status'][];
  stepIndex: number;
  goTo: (index: number) => void;
  restored: boolean;
  daysSinceStarted: number;
  discard: () => void;
  status: WizardStatus;
  isLastStep: boolean;
  canAdvance: boolean;
  canSubmit: boolean;
  next: () => void;
  back: () => void;
  isFirstStep: boolean;
  onSubmit: () => void;
  /** Why the last submit was refused, as a `wizard.error.*` key; the generic retry text otherwise. */
  errorKey?: 'already_applied' | 'phone_taken' | null;
  children: ReactNode;
}

export function WizardShell<TDraft>({
  title,
  subtitle,
  steps,
  stepStatuses,
  stepIndex,
  goTo,
  restored,
  daysSinceStarted,
  discard,
  status,
  isLastStep,
  canAdvance,
  canSubmit,
  next,
  back,
  isFirstStep,
  onSubmit,
  errorKey,
  children,
}: WizardShellProps<TDraft>) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (status === 'submitted') {
    return (
      <div className="ds-screen ds-screen--narrow stack center gap-4" style={{ minHeight: '100dvh' }}>
        <span className="ds-state__icon">
          <span className="brand-shaft" aria-hidden="true">
            <span className="brand-shaft__floor brand-shaft__floor--lit" />
            <span className="brand-shaft__floor brand-shaft__floor--lit" />
            <span className="brand-shaft__floor brand-shaft__floor--lit" />
          </span>
        </span>
        <h1 className="t-center t-balance">{t('wizard.submitted.title')}</h1>
        <p className="t-muted t-center" style={{ maxWidth: '36ch' }}>
          {t('wizard.submitted.body')}
        </p>
        <Button onClick={() => navigate('/login')}>{t('wizard.submitted.action')}</Button>
      </div>
    );
  }

  const railSteps: AscensionStep[] = steps.map((definition, index) => ({
    id: definition.id,
    label: t(definition.labelKey),
    status: stepStatuses[index],
    // Jumping back to an earlier step is fine; jumping ahead is not.
    onClick: index <= stepIndex ? () => goTo(index) : undefined,
  }));

  return (
    <div className="ds-screen ds-screen--narrow stack pb-action-bar" style={{ minHeight: '100dvh' }}>
      <ScreenHeader title={title} subtitle={subtitle} />

      <Card className="mb-3">
        <div className="row between mb-3">
          <span className="label">
            {t('wizard.stepOf', { current: stepIndex + 1, total: steps.length })}
          </span>
        </div>
        <AscensionLine steps={railSteps} />
      </Card>

      {restored && (
        <Card className="mb-3">
          <p className="t-sm t-muted">
            {daysSinceStarted >= 7
              ? t('wizard.staleDraft', { days: daysSinceStarted })
              : t('wizard.restored')}
          </p>
          <div className="mt-2">
            <Button size="sm" variant="quiet" onClick={discard}>
              {t('wizard.discard')}
            </Button>
          </div>
        </Card>
      )}

      {status === 'error' && (
        <Card className="mb-3">
          <p className="t-sm t-error t-semibold">{t('wizard.error.title')}</p>
          <p className="t-sm t-muted mt-2">{t(errorKey ? `wizard.error.${errorKey}` : 'wizard.error.body')}</p>
        </Card>
      )}

      <div className="stack gap-3 grow">{children}</div>

      {isLastStep && !canSubmit && (
        <p className="t-xs t-warning t-center mt-3">{t('wizard.incomplete')}</p>
      )}

      <ActionBar>
        {!isFirstStep && (
          <Button variant="ghost" onClick={back}>
            {t('action.back')}
          </Button>
        )}
        {isLastStep ? (
          <Button
            className="grow"
            block
            disabled={!canSubmit}
            loading={status === 'submitting'}
            onClick={onSubmit}
          >
            {status === 'submitting' ? t('wizard.submitting') : t('wizard.submit')}
          </Button>
        ) : (
          <Button className="grow" block disabled={!canAdvance} onClick={next}>
            {t('action.next')}
          </Button>
        )}
      </ActionBar>
    </div>
  );
}
