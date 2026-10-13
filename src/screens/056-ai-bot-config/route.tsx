import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const AiBotConfigView = lazyScreen(() => import('./AiBotConfigView'), 'AiBotConfigView');

const route: ScreenRoute = {
  id: '056',
  path: '/admin/comm/bot',
  roles: ['admin'],
  titleKey: 'aiBotConfig.title',
  Component: AiBotConfigView,
  tab: 'comm',
};

export default route;
