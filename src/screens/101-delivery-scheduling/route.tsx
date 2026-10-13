import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DeliverySchedulingView = lazyScreen(() => import('./DeliverySchedulingView'), 'DeliverySchedulingView');

const route: ScreenRoute = {
  id: '101',
  path: '/deliveries',
  roles: ['admin', 'supplier'],
  titleKey: 'deliveryScheduling.title',
  Component: DeliverySchedulingView,
  tab: { admin: 'logistics', supplier: 'orders' },
};

export default route;
