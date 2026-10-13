import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierInvoiceMatchingView = lazyScreen(() => import('./SupplierInvoiceMatchingView'), 'SupplierInvoiceMatchingView');

const route: ScreenRoute = {
  id: '113',
  path: '/supplier-invoices',
  roles: ['admin', 'supplier'],
  titleKey: 'supplierInvoiceMatching.title',
  Component: SupplierInvoiceMatchingView,
  tab: { admin: 'supplierPay', supplier: 'invoices' },
};

export default route;
