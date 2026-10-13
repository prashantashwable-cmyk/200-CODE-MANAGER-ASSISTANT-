import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const StockInTransitView = lazyScreen(() => import('./StockInTransitView'), 'StockInTransitView');

const route: ScreenRoute = {
  id: '106',
  path: '/stock-in-transit',
  roles: ['admin'],
  titleKey: 'stockInTransit.title',
  Component: StockInTransitView,
  tab: 'logistics',
};

export default route;
