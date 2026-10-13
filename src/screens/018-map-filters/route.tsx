import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const MapFiltersView = lazyScreen(() => import('./MapFiltersView'), 'MapFiltersView');

const route: ScreenRoute = {
  id: '018',
  path: '/admin/map/filters',
  roles: ['admin'],
  titleKey: 'mapFilters.title',
  Component: MapFiltersView,
  tab: 'map',
};

export default route;
