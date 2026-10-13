import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DealTermsFinalizationView = lazyScreen(() => import('./DealTermsFinalizationView'), 'DealTermsFinalizationView');

const route: ScreenRoute = {
  id: '074',
  path: '/admin/deals/:dealId/terms',
  roles: ['admin'],
  titleKey: 'dealTermsFinalization.title',
  Component: DealTermsFinalizationView,
  tab: 'deals',
};

export default route;
