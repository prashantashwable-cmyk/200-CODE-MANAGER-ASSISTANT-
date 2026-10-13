import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ShipmentTrackingView = lazyScreen(() => import('./ShipmentTrackingView'), 'ShipmentTrackingView');

const route: ScreenRoute = {
  id: '102',
  path: '/shipments',
  roles: ['admin', 'customer', 'technician', 'supplier'],
  titleKey: 'shipmentTracking.title',
  Component: ShipmentTrackingView,
  tab: { admin: 'logistics', supplier: 'orders', customer: 'shipments', technician: 'shipments' },
};

export default route;
