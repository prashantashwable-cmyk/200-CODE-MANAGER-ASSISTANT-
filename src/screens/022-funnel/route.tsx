import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const FunnelView = lazyScreen(() => import('./FunnelView'), 'FunnelView');

const route: ScreenRoute = {
  id: '022',
  path: '/admin/analytics/funnel',
  roles: ['admin'],
  titleKey: 'funnel.title',
  Component: FunnelView,
  tab: 'analytics',
};

export default route;
