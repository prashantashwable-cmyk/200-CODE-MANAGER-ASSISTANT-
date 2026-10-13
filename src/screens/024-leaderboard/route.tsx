import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LeaderboardView = lazyScreen(() => import('./LeaderboardView'), 'LeaderboardView');

const route: ScreenRoute = {
  id: '024',
  path: '/admin/analytics/leaderboard',
  roles: ['admin'],
  titleKey: 'leaderboard.title',
  Component: LeaderboardView,
  tab: 'analytics',
};

export default route;
