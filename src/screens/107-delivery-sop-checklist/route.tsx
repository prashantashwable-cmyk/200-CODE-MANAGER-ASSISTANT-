import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DeliverySopChecklistView = lazyScreen(() => import('./DeliverySopChecklistView'), 'DeliverySopChecklistView');

const route: ScreenRoute = {
  id: '107',
  path: '/delivery-sop',
  roles: ['admin'],
  titleKey: 'deliverySop.title',
  Component: DeliverySopChecklistView,
  tab: 'logistics',
};

export default route;
