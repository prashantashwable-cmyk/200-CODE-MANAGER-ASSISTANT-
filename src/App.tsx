import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell } from '@/navigation/AppShell';
import { HOME_PATH_BY_ROLE, screenRoutes } from '@/navigation/registry';
import type { ScreenRoute } from '@/navigation/registry';
import { useAccess } from '@/features/access/AccessContext';
import { useSession } from '@/session/SessionProvider';
import { EmptyState, LoadingState, Screen } from '@/design-system';
import { SettingsScreen } from '@/screens/_settings/SettingsScreen';
import { PendingApprovalScreen } from '@/screens/_pending/PendingApprovalScreen';

/**
 * Routing is assembled from the discovered screen registry. Public (chromeless)
 * screens render bare; everything else renders inside the role-aware shell,
 * behind a session check and a per-route role check.
 */

function RequireSession({ children }: { children: React.ReactNode }) {
  const { kind, user, restoring } = useSession();
  const location = useLocation();
  const { t } = useTranslation();

  // A stored session is still being rehydrated. Redirecting here would bounce
  // a signed-in user to the login screen on every refresh and every deep link.
  if (restoring) {
    return (
      <Screen width="narrow">
        <LoadingState label={t('state.loading')} variant="cards" rows={2} />
      </Screen>
    );
  }

  if (kind === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  // A real account with no role assigned yet waits here rather than landing on
  // someone else's home screen.
  if (user && user.status === 'pending_approval') {
    return <PendingApprovalScreen />;
  }
  return <>{children}</>;
}

function RoleGuard({
  route,
  children,
}: {
  route: Pick<ScreenRoute, 'id' | 'path' | 'roles'>;
  children: React.ReactNode;
}) {
  const { role } = useSession();
  const { canOpen } = useAccess();
  // Who may open a screen is decided centrally (192): the code's route table, then Admin's decisions for the role and for the person.
  if (route.roles !== 'public' && !role) return <Navigate to="/login" replace />;
  // Said plainly rather than bouncing home, so a refused link is never mistaken for a broken one.
  if (route.roles !== 'public' && role && !canOpen(route)) return <Forbidden />;
  return <>{children}</>;
}

function Forbidden() {
  const { t } = useTranslation();
  const { role } = useSession();
  const navigate = useNavigate();
  return (
    <Screen width="narrow">
      <div data-refused>
        <EmptyState
          title={t('forbidden.title')}
          body={t('forbidden.body')}
          actionLabel={t('forbidden.home')}
          onAction={() => navigate(role ? HOME_PATH_BY_ROLE[role] : '/login', { replace: true })}
        />
      </div>
    </Screen>
  );
}

function NotFound() {
  const { t } = useTranslation();
  const { role } = useSession();
  const navigate = useNavigate();
  return (
    <Screen width="narrow">
      <EmptyState
        title={t('notFound.title')}
        body={t('notFound.body')}
        actionLabel={t('notFound.home')}
        // Within the app, never a page reload: a reload would start the data over.
        onAction={() => navigate(role ? HOME_PATH_BY_ROLE[role] : '/login', { replace: true })}
      />
    </Screen>
  );
}

/** Shown for the moment a screen's own code is still arriving (screens load when first opened). */
function ScreenLoading() {
  const { t } = useTranslation();
  return (
    <div className="ds-screen" data-screen-loading>
      <LoadingState label={t('state.loading')} variant="cards" rows={3} />
    </div>
  );
}

const loaded = (node: ReactNode) => <Suspense fallback={<ScreenLoading />}>{node}</Suspense>;

export default function App() {
  const publicRoutes = screenRoutes.filter((r) => r.chromeless);
  const shellRoutes = screenRoutes.filter((r) => !r.chromeless);

  return (
    <Routes>
      {publicRoutes.map(({ id, path, Component }) => (
        <Route key={id} path={path} element={loaded(<Component />)} />
      ))}

      <Route
        element={
          <RequireSession>
            <AppShell />
          </RequireSession>
        }
      >
        {shellRoutes.map(({ id, path, roles, Component }) => (
          <Route
            key={id}
            path={path}
            element={
              <RoleGuard route={{ id, path, roles }}>
                {loaded(<Component />)}
              </RoleGuard>
            }
          />
        ))}

        {/* Foundation-owned screens, not part of the numbered 200. */}
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
