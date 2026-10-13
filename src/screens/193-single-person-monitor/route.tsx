import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SinglePersonMonitorScreen = lazyScreen(() => import('./SinglePersonMonitorView'), 'SinglePersonMonitorScreen');

/** The morning check: the few signals worth a daily look from every part of the business, one tap to record that they were looked at, and a limited view for a backup while the Admin is away. */
const route: ScreenRoute = { id: '193', path: '/monitor', roles: ['admin'], titleKey: 'monitor.title', Component: SinglePersonMonitorScreen, tab: 'home' };

export default route;
