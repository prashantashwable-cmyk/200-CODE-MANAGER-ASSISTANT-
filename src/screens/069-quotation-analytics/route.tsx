import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const QuotationAnalyticsView = lazyScreen(() => import('./QuotationAnalyticsView'), 'QuotationAnalyticsView');

const route: ScreenRoute = {
  id: '069',
  path: '/admin/quotes/analytics',
  roles: ['admin'],
  titleKey: 'quotationAnalytics.title',
  Component: QuotationAnalyticsView,
  tab: 'quotes',
};

export default route;
