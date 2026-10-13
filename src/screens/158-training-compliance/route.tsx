import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const TrainingComplianceScreen = lazyScreen(() => import('./TrainingComplianceView'), 'TrainingComplianceScreen');

/** Admin only: is the whole workforce properly trained right now, who is not and why, and who to ask. */
const route: ScreenRoute = { id: '158', path: '/training-compliance', roles: ['admin'], titleKey: 'trainingCompliance.title', Component: TrainingComplianceScreen, tab: 'partners' };

export default route;
