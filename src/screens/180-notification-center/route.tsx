import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const NotificationCenterScreen = lazyScreen(() => import('./NotificationCenterView'), 'NotificationCenterScreen');

/** Everything the customer was sent, with where each thing stands now, and their own say in how they hear from us. */
const route: ScreenRoute = { id: '180', path: '/notifications', roles: ['customer'], titleKey: 'notifications.title', Component: NotificationCenterScreen, tab: 'home' };

export default route;
