import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const QuotationHistoryView = lazyScreen(() => import('./QuotationHistoryView'), 'QuotationHistoryView');

const route: ScreenRoute = {
  id: '066',
  path: '/admin/quotes/history',
  roles: ['admin'],
  titleKey: 'quotationHistory.title',
  Component: QuotationHistoryView,
  tab: 'quotes',
};

export default route;
