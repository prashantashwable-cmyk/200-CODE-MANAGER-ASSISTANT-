import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ProjectStatusScreen = lazyScreen(() => import('./ProjectStatusView'), 'ProjectStatusScreen');

/** The customer's own view of where a project stands: the same data as the installation timeline's customer view, with the whole journey, curated pictures and documents. */
const route: ScreenRoute = { id: '172', path: '/project-status', roles: ['customer'], titleKey: 'projectStatus.title', Component: ProjectStatusScreen, tab: 'installation' };

export default route;
