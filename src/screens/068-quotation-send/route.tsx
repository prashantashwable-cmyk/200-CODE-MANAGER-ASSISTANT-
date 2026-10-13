import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const QuotationSendView = lazyScreen(() => import('./QuotationSendView'), 'QuotationSendView');

const route: ScreenRoute = {
  id: '068',
  path: '/admin/quotes/:quotationId/send',
  roles: ['admin'],
  titleKey: 'quotationSend.title',
  Component: QuotationSendView,
  tab: 'quotes',
};

export default route;
