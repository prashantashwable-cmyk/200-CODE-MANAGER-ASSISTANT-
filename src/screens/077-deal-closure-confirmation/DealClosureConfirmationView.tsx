import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ClipboardText, Phone, User as UserIcon, WarningCircle } from '@phosphor-icons/react';
import {
  ActionBar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Sheet,
  TextArea,
  formatDate,
  formatINR,
  formatPhone,
  useToast,
} from '@/design-system';
import { useDealClosureConfirmation } from './useDealClosureConfirmation';
import { DEAL_CLOSURE_CONFIRMATION_KEYS as K } from './deal-closure-confirmation.types';

export function DealClosureConfirmationView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useDealClosureConfirmation();

  if (s.status === 'loading') {
    return (
      <Screen>
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
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

  const { deal, lead, closure, paymentRecords, supplierPo, eligibleToClose } = s.view;

  if (!eligibleToClose || !closure) {
    return (
      <Screen>
        <ScreenHeader title={lead.siteName} subtitle={deal.code} back={() => navigate(-1)} />
        <EmptyState title={t(K.notReady.title)} body={t(K.notReady.body)} />
      </Screen>
    );
  }

  const sortedPayments = [...paymentRecords].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <Screen className="pb-action-bar">
      <ScreenHeader title={lead.siteName} subtitle={deal.code} back={() => navigate(-1)} action={<Badge tone="success">{t(K.hero.closedWon)}</Badge>} />

      <div className="stack gap-4 mb-4">
        {closure.voided && (
          <Card>
            <div className="row gap-2 items-start">
              <WarningCircle size={18} className="t-error shrink-0" style={{ marginTop: 2 }} />
              <div className="stack gap-1">
                <span className="t-sm t-semibold">{t(K.voidAction.voidedBanner)}</span>
                <span className="t-xs t-muted">{closure.voidReason}</span>
                {closure.voidedAt && <span className="t-xs t-muted">{formatDate(closure.voidedAt, i18n.language)}</span>}
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className="stack gap-2 items-start">
            <CheckCircle size={26} className="t-emerald" />
            <span className="t-xs t-muted">{t(K.hero.closedOn, { date: formatDate(closure.closedAt, i18n.language) })}</span>
            <span className="num t-xl t-semibold">{formatINR(deal.agreedPrice || deal.quotedPrice)}</span>
          </div>
        </Card>

        <div>
          <h2 className="t-lg mb-1 row gap-2 items-center">
            <ClipboardText size={18} className="t-emerald" />
            {t(K.nextSteps.heading)}
          </h2>
          <p className="t-sm t-muted mb-2">{t(K.nextSteps.subtitle)}</p>
          <Card>
            <div className="stack gap-3">
              {s.estimate && (
                <div className="stack gap-1" role="note">
                  <span className="t-sm">{t(K.nextSteps.delivery, { city: s.estimate.city })}</span>
                  <span className="t-xs t-muted">
                    {s.estimate.suggestedDays !== null ? t(K.nextSteps.deliveryDays, { count: s.estimate.suggestedDays, trips: s.estimate.trips }) : t(K.nextSteps.deliveryEmerging, { count: s.estimate.trips, trips: s.estimate.trips })}
                  </span>
                </div>
              )}
              {sortedPayments.map((p) => (
                <div key={p.id} className="row between items-center gap-3">
                  <span className="t-sm">{t(`finance.paymentStage.${p.stage}`)}</span>
                  <div className="stack gap-1 items-end">
                    <span className="num t-sm t-semibold">{formatINR(p.amount)}</span>
                    <span className="t-xs t-muted">{t(K.nextSteps.stageDue, { date: formatDate(p.dueDate, i18n.language) })}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {s.contact && (
          <div>
            <h2 className="t-lg mb-2 row gap-2 items-center">
              <UserIcon size={18} className="t-emerald" />
              {t(K.contact.heading)}
            </h2>
            <Card>
              <div className="row between items-center">
                <div className="stack gap-1">
                  <span className="t-sm t-semibold">{s.contact.name}</span>
                  <span className="t-xs t-muted">{t(K.contact.role)}</span>
                </div>
                {s.contact.phone && (
                  <span className="t-sm row gap-1 items-center">
                    <Phone size={14} /> {formatPhone(s.contact.phone)}
                  </span>
                )}
              </div>
            </Card>
          </div>
        )}

        <div>
          <h2 className="t-lg mb-2">{t(K.internalSummary.heading)}</h2>
          <Card>
            <div className="stack gap-2">
              <div className="row between t-sm">
                <span className="t-muted">{t(K.internalSummary.dealValue)}</span>
                <span className="num t-semibold">{formatINR(deal.agreedPrice || deal.quotedPrice)}</span>
              </div>
              <div className="row between t-sm">
                <span className="t-muted">{t(K.internalSummary.commission)}</span>
                <span className="num t-semibold">{s.contact ? formatINR(Math.round((deal.agreedPrice || deal.quotedPrice) * 0.015)) : '—'}</span>
              </div>
              <div className="row between items-center t-sm hairline-top pt-2">
                <span className="t-muted">{t(K.internalSummary.paymentSchedule)}</span>
                <Badge tone="success">{t(K.internalSummary.paymentScheduleDone)}</Badge>
              </div>
              <div className="row between items-center t-sm">
                <span className="t-muted">{t(K.internalSummary.supplierPo)}</span>
                <Badge tone={supplierPo?.status === 'failed' ? 'warning' : 'success'}>
                  {t(supplierPo?.status === 'failed' ? K.internalSummary.supplierPoFailed : K.internalSummary.supplierPoOk)}
                </Badge>
              </div>
              {supplierPo?.status === 'failed' && supplierPo.failureReason && (
                <p className="t-xs t-warning row gap-1 items-start">
                  <WarningCircle size={13} className="shrink-0 mt-1" />
                  {supplierPo.failureReason}
                </p>
              )}
            </div>
          </Card>
          <Button size="sm" variant="secondary" className="mt-2" onClick={() => navigate(`/deals/${deal.id}/celebration`)}>
            {t(K.internalSummary.viewCelebration)}
          </Button>
        </div>
      </div>

      {!closure.voided && (
        <ActionBar>
          <Button variant="ghost" onClick={s.openVoidSheet}>
            {t(K.voidAction.button)}
          </Button>
        </ActionBar>
      )}

      <Sheet
        open={s.voidSheetOpen}
        onClose={s.closeVoidSheet}
        title={t(K.voidAction.sheetTitle)}
        closeLabel={t('action.close')}
        footer={
          <Button block variant="danger" disabled={!s.voidReason.trim()} loading={s.voiding} onClick={() => void s.submitVoid().then((ok) => toast.push(t(ok ? K.toast.voided : K.toast.error), ok ? 'success' : 'error'))}>
            {t(K.voidAction.submit)}
          </Button>
        }
      >
        <div className="stack gap-1">
          <p className="t-xs t-muted mb-1">{t(K.voidAction.sheetHint)}</p>
          <span className="label">{t(K.voidAction.reasonLabel)}</span>
          <TextArea rows={3} value={s.voidReason} onChange={(e) => s.setVoidReason(e.target.value)} />
        </div>
      </Sheet>
    </Screen>
  );
}
