import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const InstallTimelineScreen = lazyScreen(() => import('./InstallTimelineView'), 'InstallTimelineScreen');

const route: ScreenRoute = {
  id: '129',
  path: '/installation-timeline/:jobId?',
  roles: ['technician', 'admin', 'customer'],
  titleKey: 'installTimeline.title',
  Component: InstallTimelineScreen,
  tab: { admin: 'map', technician: 'jobs', customer: 'installation' },
};

export default route;
