import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LiveMapView = lazyScreen(() => import('./LiveMapView'), 'LiveMapView');

const route: ScreenRoute = {
  id: '011',
  path: '/admin/map',
  roles: ['admin'],
  titleKey: 'liveMap.title',
  Component: LiveMapView,
  tab: 'map',
};

export default route;
