import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierPaymentAnalyticsView = lazyScreen(() => import('./SupplierPaymentAnalyticsView'), 'SupplierPaymentAnalyticsView');

const route: ScreenRoute = {
  id: '119',
  path: '/supplier-payment-analytics',
  roles: ['admin'],
  titleKey: 'supplierPaymentAnalytics.title',
  Component: SupplierPaymentAnalyticsView,
  tab: 'supplierPay',
};

export default route;
