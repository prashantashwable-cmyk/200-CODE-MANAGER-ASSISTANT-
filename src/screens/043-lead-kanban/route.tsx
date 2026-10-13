import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LeadKanbanView = lazyScreen(() => import('./LeadKanbanView'), 'LeadKanbanView');

const route: ScreenRoute = {
  id: '043',
  path: '/admin/leads/pipeline',
  roles: ['admin'],
  titleKey: 'leadKanban.title',
  Component: LeadKanbanView,
  tab: 'leads',
};

export default route;
