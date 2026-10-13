import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const CallLogView = lazyScreen(() => import('./CallLogView'), 'CallLogView');

const route: ScreenRoute = {
  id: '054',
  path: '/admin/comm/calls',
  roles: ['admin'],
  titleKey: 'callLog.title',
  Component: CallLogView,
  tab: 'comm',
};

export default route;
