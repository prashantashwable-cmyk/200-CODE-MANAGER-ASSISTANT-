import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LeadAssignmentView = lazyScreen(() => import('./LeadAssignmentView'), 'LeadAssignmentView');

const route: ScreenRoute = {
  id: '044',
  path: '/admin/leads/assignment',
  roles: ['admin'],
  titleKey: 'leadAssignment.title',
  Component: LeadAssignmentView,
  tab: 'leads',
};

export default route;
