import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const CommAnalyticsView = lazyScreen(() => import('./CommAnalyticsView'), 'CommAnalyticsView');

const route: ScreenRoute = {
  id: '060',
  path: '/admin/comm/analytics',
  roles: ['admin'],
  titleKey: 'commAnalytics.title',
  Component: CommAnalyticsView,
  tab: 'comm',
};

export default route;
