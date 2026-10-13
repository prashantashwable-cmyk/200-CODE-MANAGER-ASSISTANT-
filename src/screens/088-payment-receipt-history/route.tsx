import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const PaymentReceiptHistoryView = lazyScreen(() => import('./PaymentReceiptHistoryView'), 'PaymentReceiptHistoryView');

const route: ScreenRoute = {
  id: '088',
  path: '/payments/history',
  roles: ['admin', 'customer'],
  titleKey: 'paymentReceiptHistory.title',
  Component: PaymentReceiptHistoryView,
  tab: 'analytics',
};

export default route;
