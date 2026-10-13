import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const AdvancePaymentRetentionView = lazyScreen(() => import('./AdvancePaymentRetentionView'), 'AdvancePaymentRetentionView');

const route: ScreenRoute = {
  id: '118',
  path: '/advance-retention',
  roles: ['admin'],
  titleKey: 'advanceRetention.title',
  Component: AdvancePaymentRetentionView,
  tab: 'supplierPay',
};

export default route;
