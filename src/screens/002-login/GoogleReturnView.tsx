import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, LoadingState } from '@/design-system';
import { useGoogleReturn } from './useGoogleReturn';
import { LOGIN_KEYS as K } from './login.types';

/** Screen 002, the return from Google's sign-in screen (`/login/google`). */
export function GoogleReturnView() {
  const { t } = useTranslation();
  const s = useGoogleReturn();

  return (
    <div className="ds-screen ds-screen--narrow stack" style={{ minHeight: '100dvh', justifyContent: 'center' }} data-google-return={s.state}>
      {s.state === 'working' && <LoadingState label={t(K.googleReturn.working)} />}
      {s.state === 'cancelled' && (
        <EmptyState
          title={t(K.googleReturn.cancelledTitle)}
          body={t(K.googleReturn.cancelledBody)}
          actionLabel={t(K.googleReturn.back)}
          onAction={s.back}
        />
      )}
      {s.state === 'failed' && (
        <ErrorState title={t(K.googleReturn.failedTitle)} body={t(K.googleReturn.failedBody)} retryLabel={t(K.googleReturn.back)} onRetry={s.back} />
      )}
    </div>
  );
}
