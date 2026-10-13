import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const OptOutManagerView = lazyScreen(() => import('./OptOutManagerView'), 'OptOutManagerView');

const route: ScreenRoute = {
  id: '058',
  path: '/admin/comm/opt-outs',
  roles: ['admin'],
  titleKey: 'optOutManager.title',
  Component: OptOutManagerView,
  tab: 'comm',
};

export default route;
