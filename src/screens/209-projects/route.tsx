import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ProjectsScreen = lazyScreen(() => import('./ProjectsView'), 'ProjectsScreen');

/** Projects: overall progress across a quote's work orders, and the Handover and Completion Record. */
const route: ScreenRoute = {
  id: '209', path: '/projects', roles: ['customer', 'technician', 'supplier', 'owner', 'admin'], titleKey: 'projects.title', Component: ProjectsScreen,
  tab: { customer: 'installation', technician: 'jobs', supplier: 'orders', owner: 'analytics', admin: 'analytics' },
};

export default route;
