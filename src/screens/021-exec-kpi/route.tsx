import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ExecKpiView = lazyScreen(() => import('./ExecKpiView'), 'ExecKpiView');

const route: ScreenRoute = {
  id: '021',
  path: '/admin',
  roles: ['admin'],
  titleKey: 'execKpi.title',
  Component: ExecKpiView,
  tab: 'home',
};

export default route;
