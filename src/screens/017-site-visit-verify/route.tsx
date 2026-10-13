import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SiteVisitVerifyView = lazyScreen(() => import('./SiteVisitVerifyView'), 'SiteVisitVerifyView');

const route: ScreenRoute = {
  id: '017',
  path: '/admin/site-visits',
  roles: ['admin'],
  titleKey: 'siteVisitVerify.title',
  Component: SiteVisitVerifyView,
  tab: 'map',
};

export default route;
