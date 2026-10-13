import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const RefundDisputeManagementView = lazyScreen(() => import('./RefundDisputeManagementView'), 'RefundDisputeManagementView');

const route: ScreenRoute = {
  id: '090',
  path: '/admin/analytics/collections/disputes',
  roles: ['admin'],
  titleKey: 'refundDisputeManagement.title',
  Component: RefundDisputeManagementView,
  tab: 'analytics',
};

export default route;
