import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const QcElectricalScreen = lazyScreen(() => import('./QcElectricalView'), 'QcElectricalScreen');

const route: ScreenRoute = {
  id: '133',
  path: '/qc-electrical/:jobId?',
  roles: ['technician', 'admin'],
  titleKey: 'qcElec.title',
  Component: QcElectricalScreen,
  tab: { admin: 'map', technician: 'jobs' },
};

export default route;
