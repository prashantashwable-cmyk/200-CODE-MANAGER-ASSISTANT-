import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const CompanyProfileScreen = lazyScreen(() => import('./CompanyProfileView'), 'CompanyProfileScreen');

/** AIEC's name, logo, GSTIN, registered address and look: one governed source every screen and document reads, changed only by a new version that applies from a day onward. */
const route: ScreenRoute = { id: '191', path: '/company-profile', roles: ['admin'], titleKey: 'companyProfile.title', Component: CompanyProfileScreen, tab: 'settings' };

export default route;
