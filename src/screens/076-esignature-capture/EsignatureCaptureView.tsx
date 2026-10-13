import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Confetti, ShieldCheck, Signature, WarningCircle } from '@phosphor-icons/react';
import {
  ActionBar,
  AscensionLine,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  OtpInput,
  Screen,
  ScreenHeader,
  SegBar,
  SignaturePad,
  formatDate,
  useToast,
} from '@/design-system';
import type { AscensionStep } from '@/design-system';
import { useEsignatureCapture } from './useEsignatureCapture';
import { ESIGNATURE_CAPTURE_KEYS as K, OTP_LENGTH, WRONG_ATTEMPTS_BEFORE_FALLBACK } from './esignature-capture.types';

export function EsignatureCaptureView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const s = useEsignatureCapture();

  if (s.status === 'loading') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={t(K.title)} back={() => navigate(-1)} />
        <LoadingState label={t(K.loading)} variant="block" />
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

  const { deal, lead, signature, canSign } = s.view;

  if (!canSign) {
    return (
      <Screen width="narrow">
        <ScreenHeader title={lead.siteName} subtitle={deal.code} back={() => navigate(-1)} />
        <EmptyState
          title={t(K.notReady.title)}
          body={t(K.notReady.body)}
          actionLabel={t(K.notReady.goToContract)}
          onAction={() => navigate(`/admin/deals/${deal.id}/contract`)}
        />
      </Screen>
    );
  }

  const progressSteps: AscensionStep[] = [
    {
      id: 'customer',
      label: t(K.progress.customerStep),
      meta: signature?.customerSignedAt ? formatDate(signature.customerSignedAt, i18n.language) : undefined,
      status: signature?.customerSignedAt ? 'complete' : 'current',
    },
    {
      id: 'aiec',
      label: t(K.progress.aiecStep),
      meta: signature?.aiecCountersignedAt ? formatDate(signature.aiecCountersignedAt, i18n.language) : undefined,
      status: signature?.aiecCountersignedAt ? 'complete' : signature?.customerSignedAt ? 'current' : 'upcoming',
    },
  ];

  if (signature?.status === 'fully_signed') {
    return (
      <Screen width="narrow">
        <ScreenHeader title={lead.siteName} subtitle={deal.code} back={() => navigate(-1)} action={<Badge tone="success">{t(K.status.fully_signed)}</Badge>} />
        <Card className="mb-4">
          <div className="stack gap-2 items-start">
            <Confetti size={28} className="t-emerald" />
            <h2 className="t-lg t-semibold">{t(K.fullySigned.heading)}</h2>
            <p className="t-sm t-muted">{t(K.fullySigned.body)}</p>
          </div>
        </Card>
        <Card className="mb-4">
          <AscensionLine steps={progressSteps} />
        </Card>
        <Card className="mb-4">
          <div className="stack gap-2 t-sm">
            <p>{t(K.fullySigned.customerSignedLine, { name: lead.contactName, date: signature.customerSignedAt ? formatDate(signature.customerSignedAt, i18n.language) : '' })}</p>
            <p>{t(K.fullySigned.countersignedLine, { date: signature.aiecCountersignedAt ? formatDate(signature.aiecCountersignedAt, i18n.language) : '' })}</p>
          </div>
        </Card>
        <Button block onClick={() => navigate(`/admin/deals/${deal.id}/closure`)}>
          {t(K.fullySigned.viewClosure)}
        </Button>
      </Screen>
    );
  }

  if (signature?.status === 'customer_signed') {
    return (
      <Screen className="pb-action-bar" width="narrow">
        <ScreenHeader title={lead.siteName} subtitle={deal.code} back={() => navigate(-1)} action={<Badge tone="warning">{t(K.status.customer_signed)}</Badge>} />
        <Card className="mb-4">
          <AscensionLine steps={progressSteps} />
        </Card>
        <Card>
          <p className="t-sm t-semibold mb-1">{t(K.pendingCountersign.heading)}</p>
          <p className="t-sm t-muted mb-2">{t(K.pendingCountersign.body)}</p>
          <p className="t-xs t-muted">{t(K.pendingCountersign.signedBy, { name: lead.contactName })} — {signature.customerSignedAt ? formatDate(signature.customerSignedAt, i18n.language) : ''}</p>
        </Card>
        <ActionBar>
          <Button
            block
            icon={<ShieldCheck size={16} />}
            loading={s.countersigning}
            onClick={() => void s.countersign().then((ok) => toast.push(t(ok ? K.toast.countersigned : K.toast.error), ok ? 'success' : 'error'))}
          >
            {t(K.pendingCountersign.countersignButton)}
          </Button>
        </ActionBar>
      </Screen>
    );
  }

  return (
    <Screen className="pb-action-bar" width="narrow">
      <ScreenHeader title={lead.siteName} subtitle={deal.code} back={() => navigate(-1)} action={<Badge tone="neutral">{t(K.status.unsigned)}</Badge>} />

      <div className="stack gap-4 mb-4">
        <div>
          <h2 className="t-lg mb-2 row gap-2 items-center">
            <ShieldCheck size={18} className="t-emerald" />
            {t(K.otp.heading)}
          </h2>
          <Card>
            {s.identityConfirmed ? (
              <p className="t-sm t-success row gap-1 items-center">
                <CheckCircle size={16} /> {t(s.confirmedViaFallback ? K.otp.verifiedManually : K.otp.verified)}
              </p>
            ) : (
              <div className="stack gap-3">
                <p className="t-sm t-muted">{t(K.otp.body)}</p>
                <div className="stack gap-1">
                  <span className="label">{t(K.otp.label)}</span>
                  <OtpInput value={s.otpCode} onChange={s.setOtpCode} length={OTP_LENGTH} invalid={s.otpPhase === 'wrong'} label={t(K.otp.label)} />
                  {s.otpPhase === 'wrong' && <span className="t-xs t-error">{t(K.otp.wrongCode)}</span>}
                  <span className="t-xs t-muted">{t(K.otp.demoHint)}</span>
                </div>
                <Button size="sm" disabled={s.otpCode.length !== OTP_LENGTH} onClick={s.verifyOtp}>
                  {t(K.otp.verify)}
                </Button>
                {s.wrongAttempts >= WRONG_ATTEMPTS_BEFORE_FALLBACK && (
                  <div className="stack gap-2 hairline-top pt-2">
                    <p className="t-xs t-warning row gap-1 items-start">
                      <WarningCircle size={13} className="shrink-0 mt-1" />
                      {t(K.otp.fallbackOffer)}
                    </p>
                    <Button size="sm" variant="secondary" onClick={s.useManualFallback}>
                      {t(K.otp.fallbackButton)}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div>
          <h2 className="t-lg mb-2 row gap-2 items-center">
            <Signature size={18} className="t-emerald" />
            {t(K.signing.heading)}
          </h2>
          <Card>
            <div className="stack gap-3">
              <SegBar
                label={t(K.signing.heading)}
                value={s.methodTab}
                onChange={(id) => s.setMethodTab(id as 'drawn' | 'typed')}
                items={[
                  { id: 'drawn', label: t(K.signing.tabDrawn) },
                  { id: 'typed', label: t(K.signing.tabTyped) },
                ]}
              />

              {s.methodTab === 'drawn' ? (
                <div className="stack gap-1">
                  <span className="t-xs t-muted">{t(K.signing.drawHint)}</span>
                  <SignaturePad value={s.drawnDataUrl} onChange={s.setDrawnDataUrl} clearLabel={t(K.signing.clear)} disabled={!s.identityConfirmed} />
                </div>
              ) : (
                <div className="stack gap-1">
                  <span className="label">{t(K.signing.typedLabel)}</span>
                  <Input
                    value={s.typedName}
                    onChange={(e) => s.setTypedName(e.target.value)}
                    placeholder={t(K.signing.typedPlaceholder)}
                    disabled={!s.identityConfirmed}
                    style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}
                  />
                </div>
              )}

              <Checkbox checked={s.consentGiven} onChange={s.setConsentGiven} label={t(K.signing.consentLabel)} disabled={!s.identityConfirmed} />
            </div>
          </Card>
        </div>
      </div>

      <ActionBar>
        <Button
          block
          disabled={!s.canSubmitSignature}
          loading={s.signing}
          onClick={() => void s.submitSignature().then((ok) => toast.push(t(ok ? K.toast.signed : K.toast.error), ok ? 'success' : 'error'))}
        >
          {t(K.signing.submit)}
        </Button>
      </ActionBar>
    </Screen>
  );
}
