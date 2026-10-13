import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierPaymentApprovalView = lazyScreen(() => import('./SupplierPaymentApprovalView'), 'SupplierPaymentApprovalView');

const route: ScreenRoute = {
  id: '111',
  path: '/supplier-payments',
  roles: ['admin'],
  titleKey: 'supplierPaymentApproval.title',
  Component: SupplierPaymentApprovalView,
  tab: 'supplierPay',
};

export default route;
