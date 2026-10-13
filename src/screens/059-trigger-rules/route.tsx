import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const TriggerRulesView = lazyScreen(() => import('./TriggerRulesView'), 'TriggerRulesView');

const route: ScreenRoute = {
  id: '059',
  path: '/admin/comm/trigger-rules',
  roles: ['admin'],
  titleKey: 'triggerRules.title',
  Component: TriggerRulesView,
  tab: 'comm',
};

export default route;
