import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierPaymentHistoryView = lazyScreen(() => import('./SupplierPaymentHistoryView'), 'SupplierPaymentHistoryView');

const route: ScreenRoute = {
  id: '115',
  path: '/supplier-payment-history',
  roles: ['admin', 'supplier'],
  titleKey: 'supplierPaymentHistory.title',
  Component: SupplierPaymentHistoryView,
  tab: { admin: 'supplierPay', supplier: 'payments' },
};

export default route;
