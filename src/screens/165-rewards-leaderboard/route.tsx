import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const RewardsLeaderboardScreen = lazyScreen(() => import('./RewardsLeaderboardView'), 'RewardsLeaderboardScreen');

/** The contests running now, seen by the people in them: what is at stake, where they stand, how close the next place is. Admin sees the very same standings. */
const route: ScreenRoute = { id: '165', path: '/rewards-leaderboard', roles: ['surveyor', 'technician', 'admin'], titleKey: 'rewardsLeaderboard.title', Component: RewardsLeaderboardScreen, tab: { surveyor: 'earnings', technician: 'home', admin: 'partners' } };

export default route;
