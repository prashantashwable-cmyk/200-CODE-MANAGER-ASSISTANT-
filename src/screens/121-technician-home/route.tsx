import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const TechnicianHomeView = lazyScreen(() => import('./TechnicianHomeView'), 'TechnicianHomeView');

const route: ScreenRoute = {
  id: '121',
  path: '/technician',
  roles: ['technician'],
  titleKey: 'technicianHome.title',
  Component: TechnicianHomeView,
  tab: 'home',
};

export default route;
