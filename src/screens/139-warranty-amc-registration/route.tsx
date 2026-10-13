import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const WarrantyScreen = lazyScreen(() => import('./WarrantyView'), 'WarrantyScreen');

const route: ScreenRoute = {
  id: '139',
  path: '/warranty/:jobId?',
  roles: ['admin', 'customer'],
  titleKey: 'warranty.title',
  Component: WarrantyScreen,
  tab: { admin: 'map', customer: 'installation' },
};

export default route;
