import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const AutomationHealthView = lazyScreen(() => import('./AutomationHealthView'), 'AutomationHealthView');

const route: ScreenRoute = {
  id: '027',
  path: '/admin/analytics/automation',
  roles: ['admin'],
  titleKey: 'automationHealth.title',
  Component: AutomationHealthView,
  tab: 'analytics',
};

export default route;
