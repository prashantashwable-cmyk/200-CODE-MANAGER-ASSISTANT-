import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierScorecardView = lazyScreen(() => import('./SupplierScorecardView'), 'SupplierScorecardView');

const route: ScreenRoute = {
  id: '097',
  path: '/scorecard',
  roles: ['admin', 'supplier'],
  titleKey: 'supplierScorecard.title',
  Component: SupplierScorecardView,
  tab: { admin: 'suppliers', supplier: 'scorecard' },
};

export default route;
