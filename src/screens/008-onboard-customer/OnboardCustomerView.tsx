import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Link as LinkIcon } from '@phosphor-icons/react';
import {
  ActionBar,
  Button,
  Card,
  Checkbox,
  ErrorState,
  Field,
  Input,
  LoadingState,
  ScreenHeader,
  TextArea,
  Toggle,
} from '@/design-system';
import { isValidIndianMobile } from '@/features/onboarding/validators';
import { useOnboardCustomer } from './useOnboardCustomer';
import { CUSTOMER_KEYS as K } from './onboard-customer.types';

/**
 * Screen 008 — Customer quick signup, fired by a deal closing rather than
 * sought out. The customer confirms what the surveyor already captured.
 */
export function OnboardCustomerView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = useOnboardCustomer();

  if (s.state === 'loading') {
    return (
      <div className="ds-screen ds-screen--narrow">
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </div>
    );
  }

  if (s.state === 'error') {
    return (
      <div className="ds-screen ds-screen--narrow">
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t('action.retry')}
          onRetry={() => void s.reload()}
        />
      </div>
    );
  }

  if (s.state === 'done') {
    return (
      <div className="ds-screen ds-screen--narrow stack center gap-4" style={{ minHeight: '100dvh' }}>
        <span
          className="ds-state__icon"
          style={{ color: 'var(--color-success)', background: 'var(--color-success-soft)' }}
        >
          <CheckCircle size={28} weight="fill" />
        </span>
        <h1 className="t-center t-balance">{t(K.done.title)}</h1>
        <p className="t-muted t-center" style={{ maxWidth: '36ch' }}>
          {t(K.done.body)}
        </p>
        <Button onClick={() => navigate('/customer')}>{t(K.done.action)}</Button>
      </div>
    );
  }

  if ((s.state === 'linking' || s.state === 'submitting') && s.existingCustomer) {
    return (
      <div className="ds-screen ds-screen--narrow stack center gap-4" style={{ minHeight: '100dvh' }}>
        <span className="ds-state__icon">
          <LinkIcon size={26} />
        </span>
        <h1 className="t-center t-balance">{t(K.existing.title)}</h1>
        <p className="t-muted t-center" style={{ maxWidth: '38ch' }}>
          {t(K.existing.body, {
            name: s.existingCustomer.name,
            site: s.lead?.siteName ?? '',
          })}
        </p>
        {s.submitError && <p className="t-sm t-error t-center" role="alert">{t(K[s.submitError])}</p>}
        <Button loading={s.state === 'submitting'} onClick={() => void s.linkToExisting()}>{t(K.existing.action)}</Button>
      </div>
    );
  }

  const { draft, update } = s;

  return (
    <div className="ds-screen ds-screen--narrow pb-action-bar" style={{ minHeight: '100dvh' }}>
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      {s.lead && (
        <Card className="mb-3">
          <p className="t-xs t-muted">
            {t(K.fromLead, { site: s.lead.siteName, code: s.lead.code })}
          </p>
        </Card>
      )}

      <h2 className="label mt-4 mb-2">{t(K.section.details)}</h2>
      <div className="stack gap-3">
        <Field
          label={t(K.field.name)}
          required
          error={
            draft.name.length > 0 && draft.name.trim().length < 3 ? t(K.invalid.name) : undefined
          }
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          )}
        </Field>

        <Field
          label={t(K.field.phone)}
          required
          error={
            draft.phone.length > 0 && !isValidIndianMobile(draft.phone)
              ? t(K.invalid.phone)
              : undefined
          }
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              mono
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={draft.phone}
              onChange={(e) => update({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            />
          )}
        </Field>

        <Field label={t(K.field.email)} hint={t(K.field.emailHint)}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="email"
              value={draft.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          )}
        </Field>

        {/* Field surveys produce address typos; correcting one should be a
            single tap into the field, not a support call. */}
        <Field label={t(K.field.siteAddress)} hint={t(K.field.addressHint)}>
          {({ id, describedBy }) => (
            <TextArea
              id={id}
              aria-describedby={describedBy}
              value={draft.siteAddress}
              onChange={(e) => update({ siteAddress: e.target.value })}
            />
          )}
        </Field>

        <div className="grid-2">
          <Field label={t(K.field.city)}>
            {({ id }) => (
              <Input id={id} value={draft.city} onChange={(e) => update({ city: e.target.value })} />
            )}
          </Field>
          <Field label={t(K.field.pincode)}>
            {({ id }) => (
              <Input
                id={id}
                mono
                inputMode="numeric"
                maxLength={6}
                value={draft.pincode}
                onChange={(e) => update({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              />
            )}
          </Field>
        </div>
      </div>

      <h2 className="label mt-5 mb-2">{t(K.section.access)}</h2>
      <div className="stack gap-2">
        <Card>
          <span className="stack gap-1">
            <span className="t-medium">{t(K.login.otp)}</span>
            <span className="t-xs t-muted">{t(K.login.otpHint)}</span>
          </span>
        </Card>
        <p className="t-xs t-muted">{t(K.passwordLater)}</p>
      </div>

      <h2 className="label mt-5 mb-2">{t(K.section.consent)}</h2>
      <Card>
        <div className="stack gap-4">
          <Toggle
            checked={draft.consent.whatsapp}
            onChange={(value) => s.setConsent({ whatsapp: value })}
            label={t(K.consent.whatsapp)}
            description={t(K.consent.whatsappHint)}
          />
          <Toggle
            checked={draft.consent.sms}
            onChange={(value) => s.setConsent({ sms: value })}
            label={t(K.consent.sms)}
            description={t(K.consent.smsHint)}
          />
          <Checkbox
            checked={draft.consent.dataUsage}
            onChange={(value) => s.setConsent({ dataUsage: value })}
            label={
              <span className="stack gap-1">
                <span>{t(K.consent.dataUsage)}</span>
                <span className="t-xs t-muted">{t(K.consent.dataUsageHint)}</span>
              </span>
            }
          />
        </div>
      </Card>

      {(!draft.consent.whatsapp || !draft.consent.sms) && (
        <p className="t-xs t-muted mt-3">{t(K.consent.declineNote)}</p>
      )}

      {s.submitError && (
        <Card className="mt-3">
          <p className="t-sm t-error" role="alert">{t(K[s.submitError])}</p>
        </Card>
      )}

      <ActionBar>
        <Button
          block
          disabled={!s.canSubmit}
          loading={s.state === 'submitting'}
          onClick={() => void s.submit()}
        >
          {t(K.submit)}
        </Button>
      </ActionBar>
    </div>
  );
}
