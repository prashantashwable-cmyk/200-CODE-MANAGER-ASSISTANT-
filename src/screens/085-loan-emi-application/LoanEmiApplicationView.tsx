import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, Screen, ScreenHeader, Select, formatINR, useToast } from '@/design-system';
import type { AscensionStep, AscensionStepStatus, BadgeTone } from '@/design-system';
import type { LoanApplicationStatus } from '@/data/types';
import { LOAN_STEPS, useLoanEmiApplication } from './useLoanEmiApplication';
import { INCOME_RANGES, LOAN_EMI_APPLICATION_KEYS as K, TENURE_OPTIONS } from './loan-emi-application.types';

// Cancellation (086, Admin-only, pre-disbursement) branches off this linear
// rail rather than extending it — an application can never reach this view
// while cancelled (`getLoanApplicationView` excludes it from
// `activeApplication`, so a customer sees a fresh wizard instead), but the
// status type still covers it, so these stay exhaustive rather than partial.
const TRACKER_STATUSES: LoanApplicationStatus[] = ['submitted', 'under_review', 'approved', 'disbursed'];
const TRACKER_RANK: Record<LoanApplicationStatus, number> = { submitted: 0, under_review: 1, approved: 2, disbursed: 3, cancelled: -1 };
const STATUS_TONE: Record<LoanApplicationStatus, BadgeTone> = { submitted: 'neutral', under_review: 'warning', approved: 'accent', disbursed: 'success', cancelled: 'error' };

export function LoanEmiApplicationView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useLoanEmiApplication();

  if (s.status === 'loading') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={2} />
      </Screen>
    );
  }

  if (s.status === 'not_found') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <EmptyState title={t(K.notFound.title)} body={t(K.notFound.body)} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.view) {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const { view } = s;
  const app = view.activeApplication;

  if (app) {
    const rank = TRACKER_RANK[app.status];
    const trackerSteps: AscensionStep[] = TRACKER_STATUSES.map((status, i) => ({
      id: status,
      label: t(K.tracker.status[status]),
      status: (i < rank ? 'complete' : i === rank ? 'current' : 'upcoming') as AscensionStepStatus,
    }));
    const approvedLess = app.status !== 'submitted' && app.status !== 'under_review' && app.approvedAmount !== undefined && app.approvedAmount < app.requestedAmount;
    const hasGap = app.status === 'disbursed' && view.remainingBalance > 0;

    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} subtitle={view.siteName} back={() => navigate(-1)} />
        <Card className="mb-4">
          <div className="row between mb-3">
            <span className="t-lg t-medium">{t(K.tracker.heading)}</span>
            <Badge tone={STATUS_TONE[app.status]}>{t(K.tracker.status[app.status])}</Badge>
          </div>
          <AscensionLine steps={trackerSteps} orientation="horizontal" />
        </Card>

        <Card className="mb-4">
          <div className="stack gap-2">
            <div className="row between">
              <span className="t-sm t-muted">{t(K.tracker.requestedAmount)}</span>
              <span className="t-sm num t-medium">{formatINR(app.requestedAmount)}</span>
            </div>
            {app.approvedAmount !== undefined && (
              <div className="row between">
                <span className="t-sm t-muted">{t(K.tracker.approvedAmount)}</span>
                <span className="t-sm num t-medium">{formatINR(app.approvedAmount)}</span>
              </div>
            )}
          </div>

          <div className="row gap-2 mt-3 hairline-top">
            {app.status === 'disbursed' && !hasGap && <CheckCircle size={18} className="t-emerald shrink-0" />}
            <p className="t-sm t-muted">
              {app.status === 'submitted' && t(K.tracker.submittedBody)}
              {app.status === 'under_review' && t(K.tracker.underReviewBody)}
              {app.status === 'approved' && !approvedLess && t(K.tracker.approvedFullBody)}
              {app.status === 'disbursed' && t(K.tracker.disbursedBody)}
              {app.status === 'cancelled' && t(K.tracker.cancelledBody)}
            </p>
          </div>

          {approvedLess && (
            <div className="row-top gap-2 mt-3 hairline-top">
              <WarningCircle size={18} className="t-warning shrink-0" />
              <div className="stack gap-1">
                <span className="t-sm t-medium">{t(K.tracker.approvedLessTitle)}</span>
                <span className="t-sm t-muted">{t(K.tracker.approvedLessBody)}</span>
              </div>
            </div>
          )}

          {hasGap && (
            <div className="row-top gap-2 mt-3 hairline-top">
              <WarningCircle size={18} className="t-warning shrink-0" />
              <span className="t-sm t-muted">{t(K.tracker.disbursedGapBody)}</span>
            </div>
          )}
        </Card>

        {hasGap && view.firstRemainingPaymentId && (
          <Button block onClick={() => navigate(`/customer/payments/${view.firstRemainingPaymentId}/checkout`)}>
            {t(K.tracker.payGapAction)}
          </Button>
        )}
      </Screen>
    );
  }

  const { draft, update, step, stepIndex, stepStatuses, isFirstStep, isLastStep, canAdvance, canSubmit, next, back, goTo } = s.wizard;

  const railSteps: AscensionStep[] = LOAN_STEPS.map((def, i) => ({
    id: def.id,
    label: t(def.labelKey),
    status: stepStatuses[i],
    onClick: i <= stepIndex ? () => goTo(i) : undefined,
  }));

  const selectedRate = s.ratesTable?.find((r) => r.tenureMonths === draft.tenureMonths) ?? null;

  return (
    <Screen width="narrow" className="pb-action-bar">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} back={() => navigate(-1)} />

      <Card className="mb-4">
        <AscensionLine steps={railSteps} orientation="horizontal" />
      </Card>

      {step.id === 'precheck' && (
        <Card className="mb-4">
          <h2 className="t-lg mb-2">{t(K.precheck.heading)}</h2>
          <p className="t-sm t-muted mb-3">{t(K.precheck.body)}</p>
          <div className="stack gap-3">
            <div className="stack gap-1">
              <span className="label">{t(K.precheck.incomeLabel)}</span>
              <Select value={draft.incomeRange} onChange={(e) => update({ incomeRange: e.target.value as never })}>
                <option value="" disabled>
                  —
                </option>
                {INCOME_RANGES.map((r) => (
                  <option key={r} value={r}>
                    {t(K.precheck.income[r])}
                  </option>
                ))}
              </Select>
            </div>
            <div className="stack gap-1">
              <span className="label">{t(K.precheck.tenureLabel)}</span>
              <Select value={draft.tenurePreferenceMonths} onChange={(e) => update({ tenurePreferenceMonths: Number(e.target.value) })}>
                <option value="" disabled>
                  —
                </option>
                {TENURE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {t(K.review.monthsSuffix, { count: m })}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {s.precheckResult && (
            <div className="row-top gap-2 mt-3 hairline-top">
              {s.precheckResult.eligible ? <CheckCircle size={18} className="t-emerald shrink-0" /> : <WarningCircle size={18} className="t-warning shrink-0" />}
              <div className="stack gap-1">
                <span className="t-sm t-medium">{t(s.precheckResult.eligible ? K.precheck.resultEligible : K.precheck.resultNotEligible)}</span>
                {!s.precheckResult.eligible && s.precheckResult.reasonKey && <span className="t-xs t-muted">{t(s.precheckResult.reasonKey)}</span>}
              </div>
            </div>
          )}
        </Card>
      )}

      {step.id === 'details' && (
        <>
          <Card className="mb-4">
            <div className="row between">
              <span className="t-sm t-muted">{t(K.details.remainingBalance)}</span>
              <span className="t-sm num t-medium">{formatINR(view.remainingBalance)}</span>
            </div>
          </Card>

          <Card className="mb-4">
            <h2 className="t-lg mb-3">{t(K.details.heading)}</h2>
            <div className="stack gap-3">
              <div className="stack gap-1">
                <span className="label">{t(K.details.amountLabel)}</span>
                <Input
                  type="number"
                  mono
                  value={draft.requestedAmount}
                  onChange={(e) => {
                    const n = Math.max(0, Math.min(view.remainingBalance, Number(e.target.value) || 0));
                    update({ requestedAmount: n });
                  }}
                />
                <span className="t-xs t-muted">{t(K.details.amountHint)}</span>
              </div>
              <div className="stack gap-1">
                <span className="label">{t(K.details.tenureLabel)}</span>
                <Select value={draft.tenureMonths} onChange={(e) => update({ tenureMonths: Number(e.target.value) })}>
                  {TENURE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {t(K.review.monthsSuffix, { count: m })}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          {s.ratesStatus === 'loading' && (
            <Card className="mb-4">
              <p className="t-sm t-muted center t-center">{t(K.details.ratesLoading)}</p>
            </Card>
          )}

          {s.ratesStatus === 'unavailable' && (
            <Card className="mb-4">
              <div className="row-top gap-2">
                <WarningCircle size={20} className="t-error shrink-0" />
                <div className="stack gap-1 grow">
                  <span className="t-medium">{t(K.details.ratesUnavailable.title)}</span>
                  <span className="t-sm t-muted">{t(K.details.ratesUnavailable.body)}</span>
                  <Button size="sm" variant="secondary" className="mt-2" onClick={s.fetchRates}>
                    {t('action.retry')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {s.ratesStatus === 'loaded' && selectedRate && draft.emiAmount !== null && draft.totalRepayment !== null && (
            <Card className="mb-4">
              <p className="t-xs t-muted mb-2">{t(K.details.partnerName)}</p>
              <div className="stack gap-2">
                <div className="row between">
                  <span className="t-sm t-muted">{t(K.details.rate)}</span>
                  <span className="t-sm t-medium">{selectedRate.annualRatePercent}%</span>
                </div>
                <div className="row between hairline-top">
                  <span className="t-sm t-muted">{t(K.details.emi)}</span>
                  <span className="t-lg num t-medium">
                    {formatINR(draft.emiAmount)}
                    <span className="t-xs t-muted">{t(K.details.perMonth)}</span>
                  </span>
                </div>
                <div className="row between">
                  <span className="t-sm t-muted">{t(K.details.totalRepayment)}</span>
                  <span className="t-sm num">{formatINR(draft.totalRepayment)}</span>
                </div>
                <div className="row between">
                  <span className="t-sm t-muted">{t(K.details.cashPrice)}</span>
                  <span className="t-sm num">{formatINR(Number(draft.requestedAmount))}</span>
                </div>
                <div className="row between">
                  <span className="t-sm t-muted">{t(K.details.interestCost)}</span>
                  <span className="t-sm num t-warning">{formatINR(draft.totalRepayment - Number(draft.requestedAmount))}</span>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {step.id === 'review' && draft.interestRatePercent !== null && draft.emiAmount !== null && draft.totalRepayment !== null && (
        <Card className="mb-4">
          <h2 className="t-lg mb-3">{t(K.review.heading)}</h2>
          <div className="stack gap-2">
            <div className="row between">
              <span className="t-sm t-muted">{t(K.review.incomeRange)}</span>
              <span className="t-sm t-medium">{draft.incomeRange && t(K.precheck.income[draft.incomeRange])}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.review.precheckResult)}</span>
              <span className="t-sm t-medium">{t(s.precheckResult?.eligible ? K.precheck.resultEligible : K.precheck.resultNotEligible)}</span>
            </div>
            <div className="row between hairline-top">
              <span className="t-sm t-muted">{t(K.review.amount)}</span>
              <span className="t-sm num t-medium">{formatINR(Number(draft.requestedAmount))}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.review.tenure)}</span>
              <span className="t-sm t-medium">{t(K.review.monthsSuffix, { count: Number(draft.tenureMonths) })}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.review.rate)}</span>
              <span className="t-sm t-medium">{draft.interestRatePercent}%</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.review.emi)}</span>
              <span className="t-sm num t-medium">{formatINR(draft.emiAmount)}</span>
            </div>
            <div className="row between">
              <span className="t-sm t-muted">{t(K.review.totalRepayment)}</span>
              <span className="t-sm num">{formatINR(draft.totalRepayment)}</span>
            </div>
          </div>
        </Card>
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
            loading={s.submitting}
            onClick={() => void s.submit().then((ok) => !ok && toast.push(t(K.error.title), 'error'))}
          >
            {t(K.actionBar.submit)}
          </Button>
        ) : (
          <Button className="grow" block disabled={!canAdvance} onClick={next}>
            {t('action.next')}
          </Button>
        )}
      </ActionBar>
    </Screen>
  );
}
