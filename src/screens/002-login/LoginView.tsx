import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ChartLineUp,
  GoogleLogo,
  HardHat,
  MapPinLine,
  User as UserIcon,
} from '@phosphor-icons/react';
import { Button, Card, Checkbox, Field, Input, SegBar, Tabs } from '@/design-system';
import type { Role } from '@/data/types';
import { useLogin } from './useLogin';
import { DEMO_ROLES, LOGIN_KEYS as K } from './login.types';

const ROLE_ICON: Record<string, JSX.Element> = {
  admin: <ChartLineUp size={24} />,
  surveyor: <MapPinLine size={24} />,
  technician: <HardHat size={24} />,
  customer: <UserIcon size={24} />,
};

/**
 * Screen 002 — Login, with the Demo Mode bypass one tap away rather than
 * buried in a menu. A first-time visitor reaches a populated dashboard in two
 * taps with no field to fill.
 */
export function LoginView() {
  const { t } = useTranslation();
  const s = useLogin();

  return (
    <div className="ds-screen ds-screen--narrow stack" style={{ minHeight: '100dvh' }}>
      <div className="stack gap-2 center mt-5 mb-4">
        <span className="brand-shaft" aria-hidden="true">
          <span className="brand-shaft__floor brand-shaft__floor--lit" style={{ width: 34 }} />
          <span className="brand-shaft__floor brand-shaft__floor--lit" style={{ width: 34 }} />
          <span className="brand-shaft__floor" style={{ width: 34 }} />
        </span>
        <h1 className="t-center t-balance mt-2">{t(K.title)}</h1>
        <p className="t-sm t-muted t-center" style={{ maxWidth: '32ch' }}>
          {t(K.subtitle)}
        </p>
      </div>

      <Tabs
        label={t(K.title)}
        value={s.tab}
        onChange={(id) => s.setTab(id as 'login' | 'demo')}
        items={[
          { id: 'login', label: t(K.tab.login) },
          { id: 'demo', label: t(K.tab.demo) },
        ]}
      />

      <div className="grow mt-4">
        {s.tab === 'demo' ? <DemoTab state={s} /> : <LoginTab state={s} />}
      </div>
    </div>
  );
}

function LoginTab({ state: s }: { state: ReturnType<typeof useLogin> }) {
  const { t } = useTranslation();

  return (
    <div className="stack gap-4">
      <SegBar
        label={t(K.tab.login)}
        value={s.method}
        onChange={(id) => s.setMethod(id as 'phone' | 'email')}
        items={[
          { id: 'phone', label: t(K.method.phone) },
          { id: 'email', label: t(K.method.email) },
        ]}
      />

      {s.method === 'phone' ? (
        <Field
          label={t(K.field.phone)}
          hint={t(K.field.phoneHint)}
          error={
            s.error === 'invalidPhone' || s.error === 'unknownNumber'
              ? t(K.error[s.error])
              : undefined
          }
          required
        >
          {({ id, describedBy, invalid }) => (
            <div className="row gap-2">
              <span
                className="num t-medium row center shrink-0"
                style={{
                  minHeight: 'var(--tap-target)',
                  padding: '0 var(--space-3)',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                +91
              </span>
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                mono
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={s.phone}
                onChange={(e) => s.setPhone(e.target.value)}
              />
            </div>
          )}
        </Field>
      ) : (
        <Card>
          <p className="t-sm t-muted" data-login-note="email-not-connected">{t(K.emailNotConnected)}</p>
        </Card>
      )}

      <Checkbox checked={s.remember} onChange={s.setRemember} label={t(K.remember)} />

      {s.error === 'network' && (
        <p className="t-sm t-error" role="alert">
          {t(K.error.network)}
        </p>
      )}
      {s.error === 'tooMany' && (
        <p className="t-sm t-error" role="alert">
          {t(K.error.tooMany)}
        </p>
      )}
      {s.error === 'roleMismatch' && (
        <p className="t-sm t-error" role="alert">
          {t(K.error.roleMismatch)}
        </p>
      )}

      <div className="stack gap-2">
        <Button
          block
          loading={s.status === 'submitting'}
          disabled={s.method !== 'phone' || !s.canSubmitPhone}
          onClick={s.submitPhone}
        >
          {t(K.continueWithOtp)}
        </Button>
        <Button
          variant="ghost"
          block
          icon={<GoogleLogo size={18} />}
          disabled={!s.googleEnabled || s.status === 'submitting'}
          loading={s.googleStarting}
          onClick={() => void s.signInWithGoogle()}
          aria-describedby={s.googleEnabled ? undefined : 'login-google-note'}
          data-google={s.googleEnabled ? 'on' : 'off'}
        >
          {t(K.google)}
        </Button>
        {s.error === 'google' && (
          <p className="t-sm t-error t-center" role="alert">
            {t(K.error.google)}
          </p>
        )}
        {!s.googleEnabled && (
          <p id="login-google-note" className="t-xs t-muted t-center">{t(K.googleNotConnected)}</p>
        )}
        <Link to="/forgot-password" className="t-sm t-center mt-2">
          {t(K.forgot)}
        </Link>
      </div>

      <p className="t-xs t-muted t-center" data-login-note={s.server ? 'server' : 'demo'}>{t(s.server ? K.serverNote : K.simulatedNote)}</p>
    </div>
  );
}

function DemoTab({ state: s }: { state: ReturnType<typeof useLogin> }) {
  const { t } = useTranslation();

  return (
    <div className="stack gap-3">
      <div className="stack gap-1">
        <h2 className="t-lg">{t(K.demo.heading)}</h2>
        <p className="t-sm t-muted">{t(K.demo.body)}</p>
      </div>

      <div className="grid-auto" style={{ ['--min' as string]: '150px' }}>
        {DEMO_ROLES.map((role: Role, index) => (
          <Card
            key={role}
            riseIndex={index}
            onClick={s.enteringRole ? undefined : () => void s.enterDemoAs(role)}
            selected={s.enteringRole === role}
          >
            <div className="stack gap-2">
              <span className="t-emerald">{ROLE_ICON[role]}</span>
              <span className="t-md t-semibold">{t(`role.${role}`)}</span>
              <span className="t-xs t-muted">{t(K.demo.role[role as keyof typeof K.demo.role])}</span>
              {s.enteringRole === role && (
                <span className="t-xs t-accent" role="status">
                  {t(K.demo.entering)}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {s.error === 'network' && (
        <p className="t-sm t-error" role="alert">
          {t(K.error.network)}
        </p>
      )}

      <p className="t-xs t-muted t-center mt-2">{t(K.demo.safety)}</p>
    </div>
  );
}
