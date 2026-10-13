import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SkillMatrixScreen = lazyScreen(() => import('./SkillMatrixView'), 'SkillMatrixScreen');

/** Admin only: where the workforce is thin, against what the pipeline will ask of it, and the training (or recruitment) that would close the gap. */
const route: ScreenRoute = { id: '157', path: '/skill-matrix', roles: ['admin'], titleKey: 'skillMatrix.title', Component: SkillMatrixScreen, tab: 'partners' };

export default route;
