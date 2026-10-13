import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const PricingConfigView = lazyScreen(() => import('./PricingConfigView'), 'PricingConfigView');

const route: ScreenRoute = {
  id: '070',
  path: '/admin/quotes/pricing',
  roles: ['admin'],
  titleKey: 'pricingConfig.title',
  Component: PricingConfigView,
  tab: 'quotes',
};

export default route;
