import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LeadInboxView = lazyScreen(() => import('./LeadInboxView'), 'LeadInboxView');

const route: ScreenRoute = {
  id: '041',
  path: '/admin/leads',
  roles: ['admin'],
  titleKey: 'leadInbox.title',
  Component: LeadInboxView,
  tab: 'leads',
};

export default route;
