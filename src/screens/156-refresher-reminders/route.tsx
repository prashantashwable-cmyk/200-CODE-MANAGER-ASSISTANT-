import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const RefreshersScreen = lazyScreen(() => import('./RefreshersView'), 'RefreshersScreen');

/** Admin sees every partner's refreshers and sets the cadence; a surveyor or technician sees their own and is one tap from refreshing. */
const route: ScreenRoute = { id: '156', path: '/refreshers', roles: ['admin', 'surveyor', 'technician'], titleKey: 'refreshers.title', Component: RefreshersScreen, tab: { admin: 'partners', surveyor: 'training', technician: 'training' } };

export default route;
