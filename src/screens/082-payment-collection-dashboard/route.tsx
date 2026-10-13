import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const PaymentCollectionDashboardView = lazyScreen(() => import('./PaymentCollectionDashboardView'), 'PaymentCollectionDashboardView');

const route: ScreenRoute = {
  id: '082',
  path: '/admin/analytics/collections',
  roles: ['admin'],
  titleKey: 'paymentCollectionDashboard.title',
  Component: PaymentCollectionDashboardView,
  tab: 'analytics',
};

export default route;
