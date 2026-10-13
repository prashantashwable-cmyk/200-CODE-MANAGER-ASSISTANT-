import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ReportBuilderView = lazyScreen(() => import('./ReportBuilderView'), 'ReportBuilderView');

const route: ScreenRoute = {
  id: '030',
  path: '/admin/reports',
  roles: ['admin'],
  titleKey: 'reportBuilder.title',
  Component: ReportBuilderView,
  tab: 'analytics',
};

export default route;
