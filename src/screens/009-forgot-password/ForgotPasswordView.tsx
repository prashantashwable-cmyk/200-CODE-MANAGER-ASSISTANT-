import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Headset, ShieldCheck, X } from '@phosphor-icons/react';
import {
  Button,
  Card,
  Field,
  Input,
  OtpInput,
  ProgressBar,
  ScreenHeader,
} from '@/design-system';
import { useForgotPassword } from './useForgotPassword';
import { DEMO_RESET_CODE, RESET_KEYS as K } from './forgot-password.types';

/**
 * Screen 009 — Forgot password. Identify, verify, choose a new password, and
 * every other session on the account closes.
 */
export function ForgotPasswordView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = useForgotPassword();

  const strengthTone =
    s.strength.score >= 4 ? 'success' : s.strength.score >= 3 ? 'accent' : 'warning';

  return (
    <div className="ds-screen ds-screen--narrow stack" style={{ minHeight: '100dvh' }}>
      <div className="mt-4">
        <ScreenHeader
          title={t(K.title)}
          subtitle={t(K.subtitle)}
          back={() => navigate('/login')}
          backLabel={t('action.back')}
        />
      </div>

      {s.phase === 'noChannels' && (
        <Card>
          <div className="stack gap-2">
            <span className="row gap-2 t-semibold">
              <Headset size={18} className="t-emerald" />
              {t(K.noChannels.title)}
            </span>
            <p className="t-sm t-muted">{t(K.noChannels.body)}</p>
          </div>
        </Card>
      )}

      {s.phase === 'rateLimited' && (
        <Card>
          <div className="stack gap-2">
            <span className="t-semibold t-warning">{t(K.rateLimited.title)}</span>
            <p className="t-sm t-muted">{t(K.rateLimited.body)}</p>
            <div className="mt-2">
              <Button variant="ghost" onClick={s.reset}>
                {t('action.back')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {(s.phase === 'identify' || s.phase === 'sending') && (
        <div className="stack gap-4">
          <Field
            label={t(K.identify.label)}
            hint={t(K.identify.hint)}
            error={s.error === 'unknownAccount' ? t(K.error.unknownAccount) : undefined}
            required
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                autoComplete="username"
                value={s.identifier}
                onChange={(e) => s.setIdentifier(e.target.value)}
              />
            )}
          </Field>

          {s.error === 'network' && (
            <p className="t-sm t-error" role="alert">
              {t(K.error.network)}
            </p>
          )}

          <Button
            block
            loading={s.phase === 'sending'}
            disabled={s.identifier.trim().length < 5}
            onClick={() => void s.requestCode()}
          >
            {t(K.identify.action)}
          </Button>
        </div>
      )}

      {s.phase === 'code' && (
        <div className="stack gap-4">
          <div className="stack gap-1">
            <h2 className="t-lg">{t(K.code.heading)}</h2>
            <p className="t-sm t-muted">
              {t(K.code.sentVia, {
                channel: t(K.channel[s.channel ?? 'sms']),
                target: s.channel === 'email' ? (s.account?.email ?? '') : (s.account?.phone ?? ''),
              })}
            </p>
          </div>

          <OtpInput
            value={s.code}
            onChange={s.setCode}
            label={t(K.code.label)}
            invalid={s.error === 'wrongCode'}
            autoFocus
          />

          {s.error === 'wrongCode' && (
            <p className="t-sm t-error t-center" role="alert">
              {t(K.error.wrongCode)}
            </p>
          )}
          {s.error === 'expiredCode' && (
            <p className="t-sm t-error t-center" role="alert">
              {t(K.error.expiredCode)}
            </p>
          )}
          {s.error === 'supersededCode' && (
            <p className="t-sm t-error t-center" role="alert">
              {t(K.error.supersededCode)}
            </p>
          )}

          <Card>
            <p className="t-xs t-muted">{t(K.code.noGateway, { code: DEMO_RESET_CODE })}</p>
          </Card>

          <div className="stack gap-2">
            <Button block disabled={s.code.length !== 6} onClick={s.verifyCode}>
              {t(K.code.verify)}
            </Button>
            <Button variant="quiet" block onClick={() => void s.requestCode()}>
              {t(K.code.resend)}
            </Button>
          </div>
        </div>
      )}

      {(s.phase === 'password' || s.phase === 'submitting') && (
        <div className="stack gap-4">
          <h2 className="t-lg">{t(K.password.heading)}</h2>

          <Field
            label={t(K.password.newLabel)}
            required
            error={
              s.error === 'weakPassword'
                ? t(K.error.weakPassword)
                : s.error === 'samePassword'
                  ? t(K.error.samePassword)
                  : undefined
            }
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                type="password"
                autoComplete="new-password"
                value={s.newPassword}
                onChange={(e) => s.setNewPassword(e.target.value)}
              />
            )}
          </Field>

          <div className="stack gap-2">
            <ProgressBar
              value={s.strength.score / 4}
              tone={strengthTone}
              label={t(K.password.strength)}
            />
            <span className="t-xs t-muted">
              {t(K.password.strength)}:{' '}
              {t(K.password.level[s.strength.score as 0 | 1 | 2 | 3 | 4])}
            </span>
            <div className="stack gap-1">
              <Rule ok={s.strength.hasLength} label={t(K.password.rule.length, { count: s.minLength })} />
              <Rule ok={s.strength.hasUpper} label={t(K.password.rule.upper)} />
              <Rule ok={s.strength.hasDigit} label={t(K.password.rule.digit)} />
              <Rule ok={s.strength.hasSymbol} label={t(K.password.rule.symbol)} />
            </div>
          </div>

          <Field
            label={t(K.password.confirmLabel)}
            required
            error={s.error === 'mismatch' ? t(K.error.mismatch) : undefined}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                type="password"
                autoComplete="new-password"
                value={s.confirmPassword}
                onChange={(e) => s.setConfirmPassword(e.target.value)}
              />
            )}
          </Field>

          <Button
            block
            loading={s.phase === 'submitting'}
            disabled={!s.newPassword || !s.confirmPassword}
            onClick={() => void s.submitPassword()}
          >
            {t(K.password.submit)}
          </Button>
        </div>
      )}

      {s.phase === 'done' && (
        <div className="stack center gap-4 grow">
          <span
            className="ds-state__icon"
            style={{ color: 'var(--color-success)', background: 'var(--color-success-soft)' }}
          >
            <CheckCircle size={28} weight="fill" />
          </span>
          <h2 className="t-center">{t(K.done.title)}</h2>
          <p className="t-muted t-center" style={{ maxWidth: '34ch' }}>
            {t(K.done.body)}
          </p>
          <Card className="full-w">
            <p className="t-sm row gap-2">
              <ShieldCheck size={18} className="t-emerald shrink-0" />
              {t(K.done.sessions, { count: s.sessionsClosed })}
            </p>
          </Card>
          <Button onClick={() => navigate('/login')}>{t(K.done.action)}</Button>
        </div>
      )}
    </div>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`row gap-2 t-xs ${ok ? 't-success' : 't-muted'}`}>
      {ok ? <CheckCircle size={13} weight="fill" /> : <X size={13} />}
      {label}
    </span>
  );
}
