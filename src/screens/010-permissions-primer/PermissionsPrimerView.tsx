import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BellRinging, Camera, CheckCircle, GearSix, MapPin, Warning } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { ActionBar, Badge, Button, Card, ScreenHeader } from '@/design-system';
import { HOME_PATH_BY_ROLE } from '@/navigation/registry';
import { useSession } from '@/session/SessionProvider';
import { usePermissionsPrimer } from './usePermissionsPrimer';
import { PERMISSION_KEYS as K } from './permissions.types';
import type { PermissionId } from './permissions.types';

const ICON: Record<PermissionId, ReactNode> = {
  location: <MapPin size={24} />,
  camera: <Camera size={24} />,
  notifications: <BellRinging size={24} />,
};

/**
 * Screen 010 — Permissions primer. Explains why, in plain language, before the
 * operating system asks. No permission is ever requested by AIEC without the
 * person having read the reason first.
 */
export function PermissionsPrimerView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useSession();
  const s = usePermissionsPrimer();

  const finish = () => {
    s.markSeen();
    navigate(role ? HOME_PATH_BY_ROLE[role] : '/login', { replace: true });
  };

  return (
    <div className="ds-screen ds-screen--narrow pb-action-bar" style={{ minHeight: '100dvh' }}>
      <div className="mt-4">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
      </div>

      {s.changedOutside && (
        <Card className="mb-3">
          <div className="row between gap-3">
            <p className="t-sm t-muted grow">{t(K.changedNotice)}</p>
            <Button size="sm" variant="quiet" onClick={() => void s.recheck()}>
              {t(K.recheck)}
            </Button>
          </div>
        </Card>
      )}

      <div className="stack gap-3">
        {s.items.map((id) => {
          const state = s.states[id];
          const granted = state === 'granted';
          const blocked = state === 'blocked';
          const unsupported = state === 'unsupported';

          return (
            <Card key={id}>
              <div className="row-top gap-3">
                <span
                  className="ds-state__icon shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    ...(granted
                      ? { background: 'var(--color-success-soft)', color: 'var(--color-success)' }
                      : blocked
                        ? { background: 'var(--color-error-soft)', color: 'var(--color-error)' }
                        : null),
                  }}
                >
                  {ICON[id]}
                </span>

                <div className="stack gap-2 grow">
                  <div className="row between gap-2">
                    <span className="t-md t-semibold">{t(K.item[id].title)}</span>
                    {granted && (
                      <Badge tone="success" dot>
                        {t(K.state.granted)}
                      </Badge>
                    )}
                    {blocked && (
                      <Badge tone="error" dot>
                        {t(K.state.blocked)}
                      </Badge>
                    )}
                    {state === 'denied' && <Badge tone="warning">{t(K.state.denied)}</Badge>}
                    {unsupported && <Badge tone="neutral">{t(K.state.unsupported)}</Badge>}
                  </div>

                  <p className="t-sm t-muted">{t(K.item[id].why)}</p>

                  {!granted && !unsupported && (
                    <p className="t-xs t-muted">{t(K.item[id].ifDenied)}</p>
                  )}

                  {/* A permanently-blocked permission cannot be re-prompted —
                      pointing at device settings is the only honest option. */}
                  {blocked ? (
                    <div className="stack gap-1 mt-2">
                      <span className="row gap-2 t-xs t-error">
                        <GearSix size={14} className="shrink-0" />
                        {t(K.openSettings)}
                      </span>
                      <span className="t-xs t-muted">{t(K.openSettingsHint)}</span>
                    </div>
                  ) : granted ? (
                    <span className="row gap-2 t-xs t-success mt-1">
                      <CheckCircle size={14} weight="fill" />
                      {t(K.state.granted)}
                    </span>
                  ) : unsupported ? null : (
                    <div className="row gap-2 mt-2">
                      <Button
                        size="sm"
                        loading={state === 'requesting'}
                        onClick={() => void s.request(id)}
                      >
                        {t(K.allow)}
                      </Button>
                      <Button size="sm" variant="quiet" onClick={finish}>
                        {t(K.notNow)}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Stated once, calmly, without scaring anyone off. */}
      {s.items.includes('location') && !s.locationUsable && (
        <Card className="mt-3">
          <p className="t-sm t-warning row gap-2">
            <Warning size={16} className="shrink-0" />
            {t(K.locationWarning)}
          </p>
        </Card>
      )}

      <ActionBar>
        <Button variant="ghost" onClick={finish}>
          {t(K.skip)}
        </Button>
        <Button
          className="grow"
          block
          loading={s.busy}
          onClick={() => void s.requestAll().then(finish)}
        >
          {t(K.enableAll)}
        </Button>
      </ActionBar>
    </div>
  );
}
