import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ProductionStatusView = lazyScreen(() => import('./ProductionStatusView'), 'ProductionStatusView');

const route: ScreenRoute = {
  id: '096',
  path: '/orders/production/:recordId',
  roles: ['admin', 'supplier'],
  titleKey: 'productionStatus.title',
  Component: ProductionStatusView,
  tab: { admin: 'suppliers', supplier: 'orders' },
};

export default route;
