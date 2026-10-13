import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierDisputeResolutionView = lazyScreen(() => import('./SupplierDisputeResolutionView'), 'SupplierDisputeResolutionView');

const route: ScreenRoute = {
  id: '117',
  path: '/supplier-disputes',
  roles: ['admin'],
  titleKey: 'supplierDispute.title',
  Component: SupplierDisputeResolutionView,
  tab: 'supplierPay',
};

export default route;
