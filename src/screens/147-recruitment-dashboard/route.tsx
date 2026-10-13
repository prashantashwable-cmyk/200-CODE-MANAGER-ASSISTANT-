import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DashboardScreen = lazyScreen(() => import('./DashboardView'), 'DashboardScreen');

const route: ScreenRoute = { id: '147', path: '/recruitment', roles: ['admin'], titleKey: 'recruitDash.title', Component: DashboardScreen, tab: 'partners' };

export default route;
