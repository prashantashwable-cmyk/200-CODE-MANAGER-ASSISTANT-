import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ReferralLandingScreen = lazyScreen(() => import('./ReferralView'), 'ReferralLandingScreen');
const ReferralScreen = lazyScreen(() => import('./ReferralView'), 'ReferralScreen');

/** The customer's own referral desk, and the public page a referred person lands on from their friend's link (no account needed). */
const routes: ScreenRoute[] = [
  { id: '179', path: '/referrals', roles: ['customer'], titleKey: 'referral.title', Component: ReferralScreen, tab: 'home' },
  { id: '179', path: '/refer/:code', roles: 'public', titleKey: 'referral.landing.brand', Component: ReferralLandingScreen, chromeless: true },
];

export default routes;
