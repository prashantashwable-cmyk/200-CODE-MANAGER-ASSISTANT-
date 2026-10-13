import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DamagedPartsReportView = lazyScreen(() => import('./DamagedPartsReportView'), 'DamagedPartsReportView');

const route: ScreenRoute = {
  id: '108',
  path: '/damaged-parts',
  roles: ['admin', 'technician'],
  titleKey: 'damagedParts.title',
  Component: DamagedPartsReportView,
  tab: { admin: 'logistics', technician: 'shipments' },
};

export default route;
