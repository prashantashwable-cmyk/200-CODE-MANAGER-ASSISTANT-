import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const AutoReconciliationView = lazyScreen(() => import('./AutoReconciliationView'), 'AutoReconciliationView');

const route: ScreenRoute = {
  id: '120',
  path: '/reconciliation',
  roles: ['admin'],
  titleKey: 'reconciliation.title',
  Component: AutoReconciliationView,
  tab: 'analytics',
};

export default route;
