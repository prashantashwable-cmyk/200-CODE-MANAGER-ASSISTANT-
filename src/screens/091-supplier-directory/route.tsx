import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierDirectoryView = lazyScreen(() => import('./SupplierDirectoryView'), 'SupplierDirectoryView');

const route: ScreenRoute = {
  id: '091',
  path: '/admin/suppliers',
  roles: ['admin'],
  titleKey: 'supplierDirectory.title',
  Component: SupplierDirectoryView,
  tab: 'suppliers',
};

export default route;
