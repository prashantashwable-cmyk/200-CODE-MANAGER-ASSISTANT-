import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const TrainingLibraryScreen = lazyScreen(() => import('./TrainingLibraryView'), 'TrainingLibraryScreen');

/** Everyone who works for AIEC in the field or supplies it learns here, each with the curriculum their own role requires. */
const route: ScreenRoute = { id: '151', path: '/training', roles: ['surveyor', 'technician', 'supplier'], titleKey: 'trainingLib.title', Component: TrainingLibraryScreen, tab: 'training' };

export default route;
