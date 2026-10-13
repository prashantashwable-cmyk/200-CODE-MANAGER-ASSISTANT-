import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const AutomationSandboxScreen = lazyScreen(() => import('./AutomationSandboxView'), 'AutomationSandboxScreen');

/** Try a rule on typical situations before it touches anyone, compare a change with what was accepted, and take a tested rule live. Nothing here changes a real record. */
const route: ScreenRoute = { id: '190', path: '/automation-sandbox', roles: ['admin'], titleKey: 'automationSandbox.title', Component: AutomationSandboxScreen, tab: 'analytics' };

export default route;
