import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const NegotiationThreadView = lazyScreen(() => import('./NegotiationThreadView'), 'NegotiationThreadView');

const route: ScreenRoute = {
  id: '072',
  path: '/admin/deals/:negotiationId/thread',
  roles: ['admin'],
  titleKey: 'negotiationThread.title',
  Component: NegotiationThreadView,
  tab: 'deals',
};

export default route;
