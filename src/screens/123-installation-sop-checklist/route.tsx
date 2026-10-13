import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const InstallationSopChecklistView = lazyScreen(() => import('./InstallationSopChecklistView'), 'InstallationSopChecklistView');

const route: ScreenRoute = {
  id: '123',
  path: '/technician/jobs/:jobId/sop',
  roles: ['technician'],
  titleKey: 'installSop.title',
  Component: InstallationSopChecklistView,
  tab: 'jobs',
};

export default route;
