import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LeadSourceAttributionView = lazyScreen(() => import('./LeadSourceAttributionView'), 'LeadSourceAttributionView');

const route: ScreenRoute = {
  id: '048',
  path: '/admin/leads/attribution',
  roles: ['admin'],
  titleKey: 'leadSourceAttribution.title',
  Component: LeadSourceAttributionView,
  tab: 'leads',
};

export default route;
