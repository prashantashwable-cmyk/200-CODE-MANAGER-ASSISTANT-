import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ClockCounterClockwise, FileText, PencilSimple, ShieldCheck } from '@phosphor-icons/react';
import {
  ActionBar,
  AscensionLine,
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Sheet,
  TextArea,
  formatDate,
  formatINR,
  useToast,
} from '@/design-system';
import type { AscensionStep, BadgeTone } from '@/design-system';
import type { DealTermsStatus } from '@/data/types';
import { useDealTermsFinalization } from './useDealTermsFinalization';
import { ALL_PAYMENT_STAGES, DEAL_TERMS_FINALIZATION_KEYS as K } from './deal-terms-finalization.types';

const STATUS_TONE: Record<DealTermsStatus, BadgeTone> = {
  draft: 'neutral',
  awaiting_customer: 'warning',
  confirmed: 'success',
};

export function DealTermsFinalizationView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useDealTermsFinalization();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.view) {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const { deal, lead, terms, defaultFinalPrice, currentQuotationId, negotiationId } = s.view;
  const status: DealTermsStatus = terms?.status ?? 'draft';
  const corePctInvalid = Math.abs(s.corePct - 100) > 0.01;

  const editElsewhere = () => {
    if (currentQuotationId) navigate(`/admin/quotes/${currentQuotationId}/preview`);
    else if (negotiationId) navigate(`/admin/deals/${negotiationId}/thread`);
  };

  const confirmSteps: AscensionStep[] = [
    {
      id: 'internal',
      label: t(K.confirmation.internalStep),
      meta: terms?.internalConfirmedAt ? formatDate(terms.internalConfirmedAt, i18n.language) : undefined,
      status: terms?.internalConfirmedAt ? 'complete' : 'current',
    },
    {
      id: 'customer',
      label: t(K.confirmation.customerStep),
      meta: terms?.customerConfirmedAt ? formatDate(terms.customerConfirmedAt, i18n.language) : undefined,
      status: terms?.customerConfirmedAt ? 'complete' : terms?.internalConfirmedAt ? 'current' : 'upcoming',
    },
  ];

  return (
    <Screen className={s.isEditable || status === 'awaiting_customer' ? 'pb-action-bar' : ''}>
      <ScreenHeader
        title={lead.siteName}
        subtitle={deal.code}
        back={() => navigate(-1)}
        action={<Badge tone={STATUS_TONE[status]}>{t(K.status[status])}</Badge>}
      />

      <div className="stack gap-4 mb-4">
        <Card>
          <div className="row between items-center">
            <span className="label">{t(K.summary.finalPrice)}</span>
            <span className="num t-xl t-semibold">{formatINR(defaultFinalPrice)}</span>
          </div>
          {(currentQuotationId || negotiationId) && (
            <Button size="sm" variant="ghost" className="mt-2" onClick={editElsewhere}>
              <PencilSimple size={14} /> {t(K.summary.editElsewhere)}
            </Button>
          )}
        </Card>

        <div>
          <h2 className="t-lg mb-1 row gap-2 items-center">
            <FileText size={18} className="t-emerald" />
            {t(K.paymentPlan.heading)}
          </h2>
          <p className="t-sm t-muted mb-2">{t(K.paymentPlan.subtitle)}</p>
          <Card>
            <div className="stack gap-3">
              {ALL_PAYMENT_STAGES.map((stage) => {
                const row = s.draft.paymentStagePlan.find((r) => r.stage === stage);
                const pct = row?.percentage ?? 0;
                const amount = (defaultFinalPrice * pct) / 100;
                return (
                  <div key={stage} className="row between items-center gap-3">
                    <span className="t-sm" style={{ minWidth: 0, flex: '1 1 auto' }}>
                      {t(`finance.paymentStage.${stage}`)}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      mono
                      disabled={!s.isEditable}
                      value={pct}
                      onChange={(e) => s.setStagePercentage(stage, Number(e.target.value))}
                      style={{ width: '5.5rem', textAlign: 'right' }}
                    />
                    <span className="num t-xs t-muted" style={{ width: '6.5rem', textAlign: 'right' }}>
                      {formatINR(amount)}
                    </span>
                  </div>
                );
              })}
              <div className={`row between items-center hairline-top pt-2 ${corePctInvalid ? 't-error' : 't-muted'}`}>
                <span className="t-sm t-semibold">{t(K.paymentPlan.total, { pct: s.corePct })}</span>
                {corePctInvalid && <span className="t-xs">{t(K.paymentPlan.totalMustBe100)}</span>}
              </div>
              <p className="t-xs t-muted">{t(K.paymentPlan.retentionHint)}</p>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="t-lg mb-2">{t(K.specialTerms.heading)}</h2>
          <Card>
            <div className="stack gap-1">
              <TextArea
                rows={3}
                disabled={!s.isEditable}
                placeholder={t(K.specialTerms.placeholder)}
                value={s.draft.specialTermsNotes}
                onChange={(e) => s.setSpecialTermsNotes(e.target.value)}
              />
              <span className="t-xs t-muted">{t(K.specialTerms.hint)}</span>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="t-lg mb-2 row gap-2 items-center">
            <ShieldCheck size={18} className="t-emerald" />
            {t(K.confirmation.heading)}
          </h2>
          <Card>
            <AscensionLine steps={confirmSteps} />
            <div className="stack gap-2 mt-3 hairline-top pt-3">
              {status === 'confirmed' && (
                <>
                  <p className="t-sm t-success row gap-1 items-center">
                    <CheckCircle size={16} /> {t(K.confirmation.bothConfirmed)}
                  </p>
                  <Button size="sm" onClick={() => navigate(`/admin/deals/${deal.id}/contract`)}>
                    {t(K.confirmation.generateContract)}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/deals/${deal.id}/schedule`)}>
                    {t(K.confirmation.setUpSchedule)}
                  </Button>
                </>
              )}
              {status === 'awaiting_customer' && <p className="t-xs t-muted">{t(K.confirmation.waitingOnCustomer)}</p>}
            </div>
          </Card>
        </div>

        {status === 'confirmed' && terms && (
          <div>
            <h2 className="t-lg mb-2 row gap-2 items-center">
              <ClockCounterClockwise size={18} className="t-emerald" />
              {t(K.amendments.heading)}
            </h2>
            <div className="stack gap-2">
              {terms.amendments.map((a) => (
                <Card key={a.id}>
                  <p className="t-sm mb-1">{a.note}</p>
                  <p className="t-xs t-muted">{t(K.amendments.loggedBy, { date: formatDate(a.amendedAt, i18n.language) })}</p>
                </Card>
              ))}
              <Button size="sm" variant="secondary" onClick={s.openAmendSheet}>
                {t(K.amendments.logButton)}
              </Button>
            </div>
          </div>
        )}
      </div>

      {s.isEditable && (
        <ActionBar>
          <div className="row gap-2">
            <Button variant="secondary" loading={s.saving} onClick={() => void s.save().then((ok) => toast.push(t(ok ? K.toast.saved : K.toast.error), ok ? 'success' : 'error'))}>
              {t('action.save')}
            </Button>
            <Button
              block
              disabled={corePctInvalid}
              loading={s.confirming}
              onClick={() => void s.confirmInternal().then((ok) => toast.push(t(ok ? K.toast.confirmedInternal : K.toast.error), ok ? 'success' : 'error'))}
            >
              {t(K.confirmation.confirmInternal)}
            </Button>
          </div>
        </ActionBar>
      )}

      {status === 'awaiting_customer' && (
        <ActionBar>
          <div className="stack gap-1">
            <Button
              block
              loading={s.confirming}
              onClick={() => void s.confirmCustomer().then((ok) => toast.push(t(ok ? K.toast.confirmedCustomer : K.toast.error), ok ? 'success' : 'error'))}
            >
              {t(K.confirmation.confirmCustomer)}
            </Button>
            <p className="t-xs t-muted" style={{ margin: 0 }}>
              {t(K.confirmation.confirmCustomerNote)}
            </p>
          </div>
        </ActionBar>
      )}

      <Sheet
        open={s.amendSheetOpen}
        onClose={s.closeAmendSheet}
        title={t(K.amendments.sheetTitle)}
        closeLabel={t('action.close')}
        footer={
          <Button block disabled={!s.amendNote.trim()} loading={s.amending} onClick={() => void s.submitAmend().then((ok) => toast.push(t(ok ? K.toast.amended : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.amendments.submit)}
          </Button>
        }
      >
        <div className="stack gap-1">
          <span className="label">{t(K.amendments.noteLabel)}</span>
          <TextArea rows={3} value={s.amendNote} onChange={(e) => s.setAmendNote(e.target.value)} />
        </div>
      </Sheet>
    </Screen>
  );
}
