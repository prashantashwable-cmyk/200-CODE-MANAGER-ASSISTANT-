import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const PermissionsPrimerView = lazyScreen(() => import('./PermissionsPrimerView'), 'PermissionsPrimerView');

const route: ScreenRoute = {
  id: '010',
  path: '/onboarding/permissions',
  roles: 'public',
  titleKey: 'permissions.title',
  Component: PermissionsPrimerView,
  chromeless: true,
};

export default route;
