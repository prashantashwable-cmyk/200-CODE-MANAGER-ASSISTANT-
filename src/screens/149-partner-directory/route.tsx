import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DirectoryScreen = lazyScreen(() => import('./DirectoryView'), 'DirectoryScreen');

/** Admin only: one master list over every partner type. It keeps no records of its own; each partner's detail stays on the role's own screen. */
const route: ScreenRoute = { id: '149', path: '/partner-directory', roles: ['admin'], titleKey: 'partnerDir.title', Component: DirectoryScreen, tab: 'partners' };

export default route;
