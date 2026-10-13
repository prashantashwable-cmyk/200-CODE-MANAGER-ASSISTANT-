import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierPaymentScheduleView = lazyScreen(() => import('./SupplierPaymentScheduleView'), 'SupplierPaymentScheduleView');

const route: ScreenRoute = {
  id: '114',
  path: '/supplier-payment-schedule',
  roles: ['admin'],
  titleKey: 'supplierPaymentSchedule.title',
  Component: SupplierPaymentScheduleView,
  tab: 'supplierPay',
};

export default route;
