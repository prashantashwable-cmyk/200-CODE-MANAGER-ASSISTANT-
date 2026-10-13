import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const UserRolePermissionsScreen = lazyScreen(() => import('./UserRolePermissionsView'), 'UserRolePermissionsScreen');

/** Who may open which screen, per role and per person: the router reads this table, every change is recorded, and exceptions need a reason and an end. */
const route: ScreenRoute = { id: '192', path: '/access-control', roles: ['admin'], titleKey: 'accessControl.title', Component: UserRolePermissionsScreen, tab: 'settings' };

export default route;
