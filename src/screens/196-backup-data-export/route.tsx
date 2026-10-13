import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const BackupExportScreen = lazyScreen(() => import('./BackupExportView'), 'BackupExportScreen');

/** When the business could be restored to, how backups are scheduled and checked, and data exports that take only what the stated purpose needs. */
const route: ScreenRoute = { id: '196', path: '/backups', roles: ['admin'], titleKey: 'backups.title', Component: BackupExportScreen, tab: 'settings' };

export default route;
