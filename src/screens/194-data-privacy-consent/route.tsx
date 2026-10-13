import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DataPrivacyConsentScreen = lazyScreen(() => import('./DataPrivacyConsentView'), 'DataPrivacyConsentScreen');

/** What people have agreed to, what they have asked about their own data, how long each kind of data is kept, and the privacy policy in force. */
const route: ScreenRoute = { id: '194', path: '/privacy', roles: ['admin'], titleKey: 'privacy.title', Component: DataPrivacyConsentScreen, tab: 'settings' };

export default route;
