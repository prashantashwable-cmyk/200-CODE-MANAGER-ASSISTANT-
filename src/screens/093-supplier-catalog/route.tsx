import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierCatalogView = lazyScreen(() => import('./SupplierCatalogView'), 'SupplierCatalogView');

const route: ScreenRoute = {
  id: '093',
  path: '/catalog',
  roles: ['admin', 'supplier'],
  titleKey: 'supplierCatalog.title',
  Component: SupplierCatalogView,
  tab: { admin: 'suppliers', supplier: 'catalog' },
};

export default route;
