import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const MapWorkspaceScreen = lazyScreen(() => import('./MapWorkspaceView'), 'MapWorkspaceScreen');

/** One map for every role. What each role sees of a site is decided by the data layer (privacy by geometry), not by this screen. */
const route: ScreenRoute = {
  id: '204',
  path: '/map',
  roles: ['owner', 'admin', 'surveyor', 'technician', 'customer', 'supplier'],
  titleKey: 'mapWork.title',
  Component: MapWorkspaceScreen,
  tab: { owner: 'map', admin: 'map', surveyor: 'home', technician: 'home', customer: 'home', supplier: 'orders' },
};

export default route;
