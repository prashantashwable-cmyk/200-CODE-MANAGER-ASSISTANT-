import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SnagListScreen = lazyScreen(() => import('./SnagListView'), 'SnagListScreen');

const route: ScreenRoute = {
  id: '135',
  path: '/snags/:jobId?',
  roles: ['technician', 'admin'],
  titleKey: 'snagList.title',
  Component: SnagListScreen,
  tab: { admin: 'map', technician: 'jobs' },
};

export default route;
