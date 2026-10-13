import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const AuditLogScreen = lazyScreen(() => import('./AuditLogView'), 'AuditLogScreen');

/** The permanent, chained record of everything the automation did on its own initiative: searched, read in full, exported with a note of who took it. */
const route: ScreenRoute = { id: '187', path: '/audit-log', roles: ['admin'], titleKey: 'auditLog.title', Component: AuditLogScreen, tab: 'analytics' };

export default route;
