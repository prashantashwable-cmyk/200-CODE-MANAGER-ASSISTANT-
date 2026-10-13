import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LostLeadView = lazyScreen(() => import('./LostLeadView'), 'LostLeadView');

const route: ScreenRoute = {
  id: '049',
  path: '/admin/leads/:leadId/lost',
  roles: ['admin'],
  titleKey: 'lostLead.title',
  Component: LostLeadView,
  tab: 'leads',
};

export default route;
