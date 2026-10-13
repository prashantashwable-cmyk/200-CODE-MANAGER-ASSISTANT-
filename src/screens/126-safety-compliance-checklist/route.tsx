import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SafetyChecklistView = lazyScreen(() => import('./SafetyChecklistView'), 'SafetyChecklistView');

const route: ScreenRoute = {
  id: '126',
  path: '/safety-checklist/:jobId',
  roles: ['technician', 'admin'],
  titleKey: 'safetyChecklist.title',
  Component: SafetyChecklistView,
  tab: { admin: 'map', technician: 'jobs' },
};

export default route;
