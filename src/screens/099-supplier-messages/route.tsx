import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierMessagesView = lazyScreen(() => import('./SupplierMessagesView'), 'SupplierMessagesView');

const route: ScreenRoute = {
  id: '099',
  path: '/supplier-messages',
  roles: ['admin', 'supplier'],
  titleKey: 'supplierMessages.title',
  Component: SupplierMessagesView,
  tab: { admin: 'suppliers', supplier: 'messages' },
};

export default route;
