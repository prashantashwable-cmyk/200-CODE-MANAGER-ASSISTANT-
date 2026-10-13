import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const MyLeadsView = lazyScreen(() => import('./MyLeadsView'), 'MyLeadsView');

const route: ScreenRoute = {
  id: '037',
  path: '/surveyor/leads',
  roles: ['surveyor'],
  titleKey: 'myLeads.title',
  Component: MyLeadsView,
  tab: 'leads',
};

export default route;
