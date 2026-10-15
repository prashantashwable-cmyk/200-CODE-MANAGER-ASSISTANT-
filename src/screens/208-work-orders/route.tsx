import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const WorkOrdersScreen = lazyScreen(() => import('./WorkOrdersView'), 'WorkOrdersScreen');

/** Customer–partner work orders: accept, start, evidence, verification, and a payment recorded only after both. */
const route: ScreenRoute = {
  id: '208', path: '/work-orders', roles: ['customer', 'technician', 'supplier', 'owner', 'admin'], titleKey: 'workOrders.title', Component: WorkOrdersScreen,
  tab: { customer: 'documents', technician: 'jobs', supplier: 'orders', owner: 'analytics', admin: 'analytics' },
};

export default route;
