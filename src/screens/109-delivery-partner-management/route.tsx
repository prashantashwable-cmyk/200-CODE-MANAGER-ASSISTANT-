import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DeliveryPartnerManagementView = lazyScreen(() => import('./DeliveryPartnerManagementView'), 'DeliveryPartnerManagementView');

const route: ScreenRoute = {
  id: '109',
  path: '/delivery-partners',
  roles: ['admin'],
  titleKey: 'deliveryPartners.title',
  Component: DeliveryPartnerManagementView,
  tab: 'logistics',
};

export default route;
