import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const MilestonePaymentReleaseView = lazyScreen(() => import('./MilestonePaymentReleaseView'), 'MilestonePaymentReleaseView');

const route: ScreenRoute = {
  id: '112',
  path: '/supplier-payment-release',
  roles: ['admin'],
  titleKey: 'supplierPaymentRelease.title',
  Component: MilestonePaymentReleaseView,
  tab: 'supplierPay',
};

export default route;
