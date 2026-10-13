import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const TerritoriesView = lazyScreen(() => import('./TerritoriesView'), 'TerritoriesView');

const route: ScreenRoute = {
  id: '015',
  path: '/admin/territories',
  roles: ['admin'],
  titleKey: 'territories.title',
  Component: TerritoriesView,
  tab: 'map',
};

export default route;
