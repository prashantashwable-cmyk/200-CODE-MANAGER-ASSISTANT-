import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const RoleSelectView = lazyScreen(() => import('./RoleSelectView'), 'RoleSelectView');

const route: ScreenRoute = {
  id: '004',
  path: '/onboarding/role',
  roles: 'public',
  titleKey: 'roleSelect.title',
  Component: RoleSelectView,
  chromeless: true,
};

export default route;
