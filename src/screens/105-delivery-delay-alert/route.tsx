import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DeliveryDelayAlertView = lazyScreen(() => import('./DeliveryDelayAlertView'), 'DeliveryDelayAlertView');

const route: ScreenRoute = {
  id: '105',
  path: '/delivery-delays',
  roles: ['admin'],
  titleKey: 'deliveryDelay.title',
  Component: DeliveryDelayAlertView,
  tab: 'logistics',
};

export default route;
