import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const CustomerHomeScreen = lazyScreen(() => import('./CustomerHomeView'), 'CustomerHomeScreen');

/** The customer's own window into their project: where it is, what is next, and how to reach AIEC. A summary read from the same records the detailed customer screens use. */
const route: ScreenRoute = { id: '171', path: '/customer', roles: ['customer'], titleKey: 'customerHome.title', Component: CustomerHomeScreen, tab: 'home' };

export default route;
