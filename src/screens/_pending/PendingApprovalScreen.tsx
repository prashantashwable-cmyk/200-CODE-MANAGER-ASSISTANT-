import { useTranslation } from 'react-i18next';
import { HourglassMedium } from '@phosphor-icons/react';
import { Button, Card, Screen } from '@/design-system';
import { useSession } from '@/session/SessionProvider';

/**
 * Where a real account with no assigned role waits. Reached from the session
 * guard, not from a route — a pending user has nowhere else to be.
 */
export function PendingApprovalScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useSession();

  return (
    <Screen width="narrow">
      <div className="stack gap-4 center" style={{ minHeight: '70dvh' }}>
        <span className="ds-state__icon">
          <HourglassMedium size={26} />
        </span>
        <h1 className="t-center t-balance">{t('pending.title')}</h1>
        <p className="t-muted t-center" style={{ maxWidth: '38ch' }}>
          {t('pending.body')}
        </p>
        {user && (
          <Card className="full-w">
            <div className="stack gap-2">
              <div className="row between">
                <span className="t-sm t-muted">{t('pendingScreen.name')}</span>
                <span className="t-sm t-semibold">{user.name}</span>
              </div>
              <div className="row between">
                <span className="t-sm t-muted">{t('pendingScreen.phone')}</span>
                <span className="t-sm t-semibold num">{user.phone}</span>
              </div>
              <div className="row between">
                <span className="t-sm t-muted">{t('pendingScreen.appliedAs')}</span>
                <span className="t-sm t-semibold">{t(`role.${user.role}`)}</span>
              </div>
            </div>
          </Card>
        )}
        <Button variant="ghost" onClick={signOut}>
          {t('action.signOut')}
        </Button>
      </div>
    </Screen>
  );
}
