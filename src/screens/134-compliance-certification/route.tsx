import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ComplianceScreen = lazyScreen(() => import('./ComplianceView'), 'ComplianceScreen');

const route: ScreenRoute = {
  id: '134',
  path: '/compliance/:jobId?',
  roles: ['technician', 'admin'],
  titleKey: 'compliance.title',
  Component: ComplianceScreen,
  tab: { admin: 'map', technician: 'jobs' },
};

export default route;
