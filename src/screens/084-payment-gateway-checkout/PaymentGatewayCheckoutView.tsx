import { useTranslation } from 'react-i18next';
import { Bank, CheckCircle, ClockCountdown, CreditCard, DeviceMobile, WarningCircle } from '@phosphor-icons/react';
import { ActionBar, Button, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, Tabs, formatDate, formatINR } from '@/design-system';
import { usePaymentGatewayCheckout } from './usePaymentGatewayCheckout';
import { GATEWAY_METHODS, PAYMENT_GATEWAY_CHECKOUT_KEYS as K } from './payment-gateway-checkout.types';

const METHOD_ICON = {
  upi: <DeviceMobile size={18} />,
  card: <CreditCard size={18} />,
  netbanking: <Bank size={18} />,
};

export function PaymentGatewayCheckoutView() {
  const { t, i18n } = useTranslation();
  const s = usePaymentGatewayCheckout();

  if (s.status === 'loading') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={2} />
      </Screen>
    );
  }

  if (s.status === 'not_found') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} />
        <EmptyState title={t(K.notFound.title)} body={t(K.notFound.body)} />
      </Screen>
    );
  }

  if (s.status === 'error' || !s.view) {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  const { payment, dealCode, siteName, amountDue } = s.view;
  const isPartial = (payment.amountReceived ?? 0) > 0 && payment.status !== 'paid';

  return (
    <Screen width="narrow" className={s.stage === 'idle' || s.stage === 'failed' ? 'pb-action-bar' : ''}>
      <ScreenHeader title={t(K.title)} />

      <Card className="mb-4">
        <h2 className="t-lg mb-3">{t(K.summary.heading)}</h2>
        <div className="stack gap-2">
          <div className="row between">
            <span className="t-sm t-muted">{t(K.summary.site)}</span>
            <span className="t-sm t-medium">{siteName}</span>
          </div>
          <div className="row between">
            <span className="t-sm t-muted">{t(K.summary.deal)}</span>
            <span className="t-sm t-medium">{dealCode}</span>
          </div>
          <div className="row between">
            <span className="t-sm t-muted">{t(K.summary.stage)}</span>
            <span className="t-sm t-medium">{t(`finance.paymentStage.${payment.stage}`)}</span>
          </div>
          {s.stage !== 'paid' && s.stage !== 'blocked' && (
            <>
              <div className="row between hairline-top">
                <span className="t-sm t-muted">{t(K.summary.amountDue)}</span>
                <span className="t-lg num t-medium">{formatINR(s.stage === 'idle' || s.stage === 'failed' ? amountDue : payment.amount)}</span>
              </div>
              {isPartial && <p className="t-xs t-muted">{t(K.summary.partialNote)}</p>}
            </>
          )}
        </div>
      </Card>

      {(s.stage === 'idle' || s.stage === 'failed') && (
        <>
          <h2 className="t-lg mb-2">{t(K.method.heading)}</h2>
          <Tabs
            label={t(K.method.heading)}
            value={s.method}
            onChange={(id) => s.setMethod(id as typeof s.method)}
            className="mb-4"
            items={GATEWAY_METHODS.map((m) => ({ id: m, label: t(K.method[m]), icon: METHOD_ICON[m] }))}
          />

          {s.stage === 'failed' && (
            <Card className="mb-4">
              <div className="row-top gap-2">
                <WarningCircle size={20} className="t-error shrink-0" />
                <div className="stack gap-1">
                  <span className="t-medium">{t(K.failed.title)}</span>
                  <span className="t-sm t-muted">{t(K.failed.body)}</span>
                </div>
              </div>
            </Card>
          )}

          <ActionBar>
            <Button block loading={s.paying} onClick={() => void s.pay()}>
              {s.stage === 'failed' ? t(K.actionBar.retry) : t(K.actionBar.pay, { amount: formatINR(amountDue) })}
            </Button>
          </ActionBar>
        </>
      )}

      {s.stage === 'processing' && (
        <Card>
          <div className="stack gap-2 center t-center">
            <ClockCountdown size={32} className="t-emerald" />
            <span className="t-medium">{t(K.processing.title)}</span>
            <span className="t-sm t-muted">{t(K.processing.body)}</span>
          </div>
        </Card>
      )}

      {s.stage === 'awaiting_confirmation' && (
        <Card>
          <div className="stack gap-2 center t-center">
            <ClockCountdown size={32} className="t-warning" />
            <span className="t-medium">{t(K.awaitingConfirmation.title)}</span>
            <span className="t-sm t-muted">{t(K.awaitingConfirmation.body)}</span>
            <span className="t-xs t-muted mt-2">{t(K.awaitingConfirmation.checkingNote)}</span>
          </div>
        </Card>
      )}

      {s.stage === 'blocked' && (
        <Card>
          <div className="stack gap-2 center t-center">
            <CheckCircle size={32} className="t-emerald" />
            <span className="t-medium">{t(K.alreadyPaid.title)}</span>
            <span className="t-sm t-muted">{t(K.alreadyPaid.body)}</span>
          </div>
        </Card>
      )}

      {s.stage === 'paid' && (
        <Card>
          <div className="stack gap-3">
            <div className="stack gap-2 center t-center">
              <CheckCircle size={40} className="t-emerald" />
              <span className="t-lg t-medium">{t(K.receipt.heading)}</span>
            </div>
            <div className="stack gap-2 hairline-top">
              <div className="row between">
                <span className="t-sm t-muted">{t(K.receipt.amountPaid)}</span>
                <span className="t-sm num t-medium">{formatINR(payment.amount)}</span>
              </div>
              <div className="row between">
                <span className="t-sm t-muted">{t(K.receipt.method)}</span>
                <span className="t-sm t-medium">{payment.method ? t(K.method[payment.method as 'upi' | 'card' | 'netbanking']) : ''}</span>
              </div>
              {payment.gatewayTransactionRef && (
                <div className="row between">
                  <span className="t-sm t-muted">{t(K.receipt.reference)}</span>
                  <span className="t-sm num">{payment.gatewayTransactionRef}</span>
                </div>
              )}
              {payment.paidAt && (
                <div className="row between">
                  <span className="t-sm t-muted">{t(K.receipt.paidAt)}</span>
                  <span className="t-sm">{formatDate(payment.paidAt, i18n.language)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </Screen>
  );
}
