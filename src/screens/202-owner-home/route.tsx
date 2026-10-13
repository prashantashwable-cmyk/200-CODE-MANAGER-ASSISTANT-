import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const OwnerHomeScreen = lazyScreen(() => import('./OwnerHomeView'), 'OwnerHomeScreen');

/** The Owner's home: what needs a decision, with the map and the business a tap away. */
const route: ScreenRoute = { id: '202', path: '/owner', roles: ['owner'], titleKey: 'ownerHome.title', Component: OwnerHomeScreen, tab: 'home' };

export default route;
