import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const PackageComparisonView = lazyScreen(() => import('./PackageComparisonView'), 'PackageComparisonView');

const route: ScreenRoute = {
  id: '065',
  path: '/admin/quotes/compare',
  roles: ['admin'],
  titleKey: 'packageComparison.title',
  Component: PackageComparisonView,
  tab: 'quotes',
};

export default route;
