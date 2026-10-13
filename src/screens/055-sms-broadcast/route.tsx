import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SmsBroadcastView = lazyScreen(() => import('./SmsBroadcastView'), 'SmsBroadcastView');

const route: ScreenRoute = {
  id: '055',
  path: '/admin/comm/broadcast',
  roles: ['admin'],
  titleKey: 'smsBroadcast.title',
  Component: SmsBroadcastView,
  tab: 'comm',
};

export default route;
