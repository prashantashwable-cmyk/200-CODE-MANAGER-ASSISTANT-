import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SecuritySessionScreen = lazyScreen(() => import('./SecuritySessionView'), 'SecuritySessionScreen');

/** Who is signed in where, the second step, sign-in events, recovery after a lost phone, and the rules that govern them. */
const route: ScreenRoute = { id: '195', path: '/security', roles: ['admin'], titleKey: 'security.title', Component: SecuritySessionScreen, tab: 'settings' };

export default route;
