import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const QuotationGeneratorView = lazyScreen(() => import('./QuotationGeneratorView'), 'QuotationGeneratorView');

const route: ScreenRoute = {
  id: '061',
  path: '/admin/quotes',
  roles: ['admin'],
  titleKey: 'quotationGenerator.title',
  Component: QuotationGeneratorView,
  tab: 'quotes',
};

export default route;
