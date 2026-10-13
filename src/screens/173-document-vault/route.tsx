import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DocumentVaultScreen = lazyScreen(() => import('./DocumentVaultView'), 'DocumentVaultScreen');

/** The customer's own copy of everything AIEC has issued to them, read from the records that issued it, never copied. */
const route: ScreenRoute = { id: '173', path: '/documents', roles: ['customer'], titleKey: 'documentVault.title', Component: DocumentVaultScreen, tab: 'documents' };

export default route;
