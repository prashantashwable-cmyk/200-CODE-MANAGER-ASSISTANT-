import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierScoreView = lazyScreen(() => import('./SupplierScoreView'), 'SupplierScoreView');

const route: ScreenRoute = {
  id: '026',
  path: '/admin/analytics/suppliers',
  roles: ['admin'],
  titleKey: 'supplierScore.title',
  Component: SupplierScoreView,
  tab: 'analytics',
};

export default route;
