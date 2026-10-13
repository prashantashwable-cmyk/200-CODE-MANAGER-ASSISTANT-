import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DealWonCelebrationView = lazyScreen(() => import('./DealWonCelebrationView'), 'DealWonCelebrationView');

const route: ScreenRoute = {
  id: '080',
  path: '/deals/:dealId/celebration',
  roles: ['admin', 'surveyor'],
  titleKey: 'dealWonCelebration.title',
  Component: DealWonCelebrationView,
  tab: 'deals',
};

export default route;
