import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ReworkScreen = lazyScreen(() => import('./ReworkView'), 'ReworkScreen');

const route: ScreenRoute = {
  id: '136',
  path: '/rework/:snagId?',
  roles: ['technician', 'admin'],
  titleKey: 'rework.title',
  Component: ReworkScreen,
  tab: { admin: 'map', technician: 'jobs' },
};

export default route;
