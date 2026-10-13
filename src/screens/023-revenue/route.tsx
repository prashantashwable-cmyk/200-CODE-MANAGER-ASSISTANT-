import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const RevenueView = lazyScreen(() => import('./RevenueView'), 'RevenueView');

const route: ScreenRoute = {
  id: '023',
  path: '/admin/analytics/revenue',
  roles: ['admin'],
  titleKey: 'revenue.title',
  Component: RevenueView,
  tab: 'analytics',
};

export default route;
