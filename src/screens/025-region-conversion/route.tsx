import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const RegionConversionView = lazyScreen(() => import('./RegionConversionView'), 'RegionConversionView');

const route: ScreenRoute = {
  id: '025',
  path: '/admin/analytics/conversion',
  roles: ['admin'],
  titleKey: 'regionConversion.title',
  Component: RegionConversionView,
  tab: 'analytics',
};

export default route;
