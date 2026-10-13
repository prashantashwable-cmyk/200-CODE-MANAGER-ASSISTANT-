import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const NotificationSettingsScreen = lazyScreen(() => import('./NotificationSettingsView'), 'NotificationSettingsScreen');

/** How the system tells Admin and staff about things that need a person: urgency decides the channels, each role has its own, and wording is tested before an alert relies on it. */
const route: ScreenRoute = { id: '183', path: '/notification-settings', roles: ['admin'], titleKey: 'internalNotifications.title', Component: NotificationSettingsScreen, tab: 'settings' };

export default route;
