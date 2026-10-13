import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ScreeningScreen = lazyScreen(() => import('./ScreeningView'), 'ScreeningScreen');

const route: ScreenRoute = { id: '143', path: '/screening', roles: ['admin'], titleKey: 'screening.title', Component: ScreeningScreen, tab: 'partners' };

export default route;
