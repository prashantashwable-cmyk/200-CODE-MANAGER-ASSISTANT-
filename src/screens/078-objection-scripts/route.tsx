import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ObjectionScriptsView = lazyScreen(() => import('./ObjectionScriptsView'), 'ObjectionScriptsView');

const route: ScreenRoute = {
  id: '078',
  path: '/admin/deals/objection-scripts',
  roles: ['admin'],
  titleKey: 'objectionScripts.title',
  Component: ObjectionScriptsView,
  tab: 'deals',
};

export default route;
