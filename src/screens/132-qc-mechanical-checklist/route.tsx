import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const QcMechanicalScreen = lazyScreen(() => import('./QcMechanicalView'), 'QcMechanicalScreen');

const route: ScreenRoute = {
  id: '132',
  path: '/qc-mechanical/:jobId?',
  roles: ['technician', 'admin'],
  titleKey: 'qcMech.title',
  Component: QcMechanicalScreen,
  tab: { admin: 'map', technician: 'jobs' },
};

export default route;
