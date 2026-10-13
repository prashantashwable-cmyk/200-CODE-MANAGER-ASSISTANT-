import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const PaymentGatewayCheckoutView = lazyScreen(() => import('./PaymentGatewayCheckoutView'), 'PaymentGatewayCheckoutView');

const route: ScreenRoute = {
  id: '084',
  path: '/customer/payments/:paymentId/checkout',
  roles: ['customer'],
  titleKey: 'paymentGatewayCheckout.title',
  Component: PaymentGatewayCheckoutView,
  tab: 'home',
};

export default route;
