import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LessonPlayerScreen = lazyScreen(() => import('./LessonPlayerView'), 'LessonPlayerScreen');

/** A module's lessons and the player for the one opened (`?lesson=<n>`). Everyone who trains in the library plays here. */
const route: ScreenRoute = { id: '152', path: '/training/:moduleId', roles: ['surveyor', 'technician', 'supplier'], titleKey: 'lessonPlayer.title', Component: LessonPlayerScreen, tab: 'training' };

export default route;
