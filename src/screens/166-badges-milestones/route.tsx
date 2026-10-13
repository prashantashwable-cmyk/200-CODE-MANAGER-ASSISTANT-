import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const BadgesScreen = lazyScreen(() => import('./BadgesView'), 'BadgesScreen');

/** Everything a partner has earned in one place, from their work, their training and their time with AIEC, with what is nearest next and how rare each one honestly is. */
const route: ScreenRoute = { id: '166', path: '/badges', roles: ['surveyor', 'technician'], titleKey: 'badges.title', Component: BadgesScreen, tab: { surveyor: 'earnings', technician: 'home' } };

export default route;
