import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DiscountApprovalView = lazyScreen(() => import('./DiscountApprovalView'), 'DiscountApprovalView');

const route: ScreenRoute = {
  id: '067',
  path: '/admin/quotes/discounts',
  roles: ['admin'],
  titleKey: 'discountApproval.title',
  Component: DiscountApprovalView,
  tab: 'quotes',
};

export default route;
