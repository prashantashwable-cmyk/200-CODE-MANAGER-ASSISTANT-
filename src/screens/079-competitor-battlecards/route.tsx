import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const CompetitorBattlecardsView = lazyScreen(() => import('./CompetitorBattlecardsView'), 'CompetitorBattlecardsView');

const route: ScreenRoute = {
  id: '079',
  path: '/admin/deals/battlecards',
  roles: ['admin'],
  titleKey: 'competitorBattlecards.title',
  Component: CompetitorBattlecardsView,
  tab: 'deals',
};

export default route;
