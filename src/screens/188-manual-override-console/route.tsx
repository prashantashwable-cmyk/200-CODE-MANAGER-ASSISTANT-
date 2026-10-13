import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ManualOverrideScreen = lazyScreen(() => import('./ManualOverrideView'), 'ManualOverrideScreen');

/** The console for forcing what a rule would not: a reason, a preview of what follows and a confirmation every time, kept permanently under Admin's name; guardrails with no override are refused. */
const route: ScreenRoute = { id: '188', path: '/override-console', roles: ['admin'], titleKey: 'manualOverride.title', Component: ManualOverrideScreen, tab: 'analytics' };

export default route;
