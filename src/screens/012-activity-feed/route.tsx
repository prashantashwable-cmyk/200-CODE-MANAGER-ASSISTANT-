import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ActivityFeedView = lazyScreen(() => import('./ActivityFeedView'), 'ActivityFeedView');

const route: ScreenRoute = {
  id: '012',
  path: '/admin/activity',
  roles: ['admin'],
  titleKey: 'activityFeed.title',
  Component: ActivityFeedView,
  tab: 'map',
};

export default route;
