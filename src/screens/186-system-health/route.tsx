import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SystemHealthScreen = lazyScreen(() => import('./SystemHealthView'), 'SystemHealthScreen');

/** The technical plumbing the automation stands on: each connection judged on AIEC's own calls, the provider's word beside it, incidents, the engine and the bot. */
const route: ScreenRoute = { id: '186', path: '/system-health', roles: ['admin'], titleKey: 'systemHealth.title', Component: SystemHealthScreen, tab: 'analytics' };

export default route;
