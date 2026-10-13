import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierOrdersView = lazyScreen(() => import('./SupplierOrdersView'), 'SupplierOrdersView');

const route: ScreenRoute = {
  id: '095',
  path: '/orders',
  roles: ['admin', 'supplier'],
  titleKey: 'supplierOrders.title',
  Component: SupplierOrdersView,
  tab: { admin: 'suppliers', supplier: 'orders' },
};

export default route;
