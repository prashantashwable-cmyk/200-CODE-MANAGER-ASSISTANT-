import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const RouteOptimizeView = lazyScreen(() => import('./RouteOptimizeView'), 'RouteOptimizeView');

const route: ScreenRoute = {
  id: '020',
  path: '/admin/routes',
  roles: ['admin'],
  titleKey: 'routeOptimize.title',
  Component: RouteOptimizeView,
  tab: 'map',
};

export default route;
