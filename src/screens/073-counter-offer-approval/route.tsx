import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const CounterOfferApprovalView = lazyScreen(() => import('./CounterOfferApprovalView'), 'CounterOfferApprovalView');

const route: ScreenRoute = {
  id: '073',
  path: '/admin/deals/counter-offers',
  roles: ['admin'],
  titleKey: 'counterOfferApproval.title',
  Component: CounterOfferApprovalView,
  tab: 'deals',
};

export default route;
