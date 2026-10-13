import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierPaymentTermsView = lazyScreen(() => import('./SupplierPaymentTermsView'), 'SupplierPaymentTermsView');

const route: ScreenRoute = {
  id: '100',
  path: '/admin/suppliers/payment-terms',
  roles: ['admin'],
  titleKey: 'supplierPaymentTerms.title',
  Component: SupplierPaymentTermsView,
  tab: 'suppliers',
};

export default route;
