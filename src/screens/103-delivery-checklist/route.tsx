import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DeliveryChecklistView = lazyScreen(() => import('./DeliveryChecklistView'), 'DeliveryChecklistView');

const route: ScreenRoute = {
  id: '103',
  path: '/delivery-checklist',
  roles: ['admin', 'technician'],
  titleKey: 'deliveryChecklist.title',
  Component: DeliveryChecklistView,
  tab: { admin: 'logistics', technician: 'shipments' },
};

export default route;
