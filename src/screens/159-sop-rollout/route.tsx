import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SopRolloutScreen = lazyScreen(() => import('./SopRolloutView'), 'SopRolloutScreen');

/** Admin announces a procedure change and tracks who has understood it; technicians, surveyors and suppliers read what changed and acknowledge. */
const route: ScreenRoute = { id: '159', path: '/sop-rollouts/:rolloutId?', roles: ['admin', 'technician', 'surveyor', 'supplier'], titleKey: 'sopRollout.title', Component: SopRolloutScreen, tab: { admin: 'partners', technician: 'training', surveyor: 'training', supplier: 'training' } };

export default route;
