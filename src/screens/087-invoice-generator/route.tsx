import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const InvoiceGeneratorView = lazyScreen(() => import('./InvoiceGeneratorView'), 'InvoiceGeneratorView');

const route: ScreenRoute = {
  id: '087',
  path: '/deals/:dealId/invoices',
  roles: ['admin', 'customer'],
  titleKey: 'invoiceGenerator.title',
  Component: InvoiceGeneratorView,
  tab: 'deals',
};

export default route;
