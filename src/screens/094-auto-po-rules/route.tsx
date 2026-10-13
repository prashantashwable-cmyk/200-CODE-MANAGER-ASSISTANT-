import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const AutoPoRulesView = lazyScreen(() => import('./AutoPoRulesView'), 'AutoPoRulesView');

const route: ScreenRoute = {
  id: '094',
  path: '/admin/suppliers/po-rules',
  roles: ['admin'],
  titleKey: 'autoPoRules.title',
  Component: AutoPoRulesView,
  tab: 'suppliers',
};

export default route;
