import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DecisionDeskScreen = lazyScreen(() => import('./DecisionDeskView'), 'DecisionDeskScreen');

/** The Owner decides here; Admin sees where each decision stands and may prepare a packet, never decide it. */
const route: ScreenRoute = { id: '201', path: '/owner/decisions', roles: ['owner', 'admin'], titleKey: 'decisionDesk.title', Component: DecisionDeskScreen, tab: { owner: 'decisions', admin: 'home' } };

export default route;
