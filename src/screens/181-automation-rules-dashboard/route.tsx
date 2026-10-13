import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const AutomationRulesScreen = lazyScreen(() => import('./AutomationRulesView'), 'AutomationRulesScreen');

/** One place to see every automation in the system by category, with the Health Monitor's own health and an emergency pause that says exactly what it does. */
const route: ScreenRoute = { id: '181', path: '/automation-rules', roles: ['admin'], titleKey: 'automationRules.title', Component: AutomationRulesScreen, tab: 'analytics' };

export default route;
