import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const FinanceView = lazyScreen(() => import('./FinanceView'), 'FinanceView');

const route: ScreenRoute = {
  id: '028',
  path: '/admin/analytics/finance',
  roles: ['admin'],
  titleKey: 'finance.title',
  Component: FinanceView,
  tab: 'analytics',
};

export default route;
