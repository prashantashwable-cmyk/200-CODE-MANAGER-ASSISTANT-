import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const PartnerTiersScreen = lazyScreen(() => import('./PartnerTiersView'), 'PartnerTiersScreen');

/** Admin only: assigning a tier changes what a partner is paid and allowed to do, so there is no partner-facing copy of this screen. */
const route: ScreenRoute = { id: '148', path: '/partner-tiers/:partnerId?', roles: ['admin'], titleKey: 'partnerTiers.title', Component: PartnerTiersScreen, tab: 'partners' };

export default route;
