import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const AlertsBoardView = lazyScreen(() => import('./AlertsBoardView'), 'AlertsBoardView');

const route: ScreenRoute = {
  id: '029',
  path: '/admin/alerts',
  roles: ['admin'],
  titleKey: 'alertsBoard.title',
  Component: AlertsBoardView,
  tab: 'alerts',
};

export default route;
