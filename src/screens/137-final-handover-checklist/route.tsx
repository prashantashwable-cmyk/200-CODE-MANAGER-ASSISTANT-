import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const HandoverScreen = lazyScreen(() => import('./HandoverView'), 'HandoverScreen');

const route: ScreenRoute = {
  id: '137',
  path: '/handover-checklist/:jobId?',
  roles: ['technician', 'admin'],
  titleKey: 'handover.title',
  Component: HandoverScreen,
  tab: { admin: 'map', technician: 'jobs' },
};

export default route;
