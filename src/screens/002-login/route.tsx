import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LoginView = lazyScreen(() => import('./LoginView'), 'LoginView');
const GoogleReturnView = lazyScreen(() => import('./GoogleReturnView'), 'GoogleReturnView');

const routes: ScreenRoute[] = [
  {
    id: '002',
    path: '/login',
    roles: 'public',
    titleKey: 'login.title',
    Component: LoginView,
    chromeless: true,
  },
  // Where Google sends a person back to after its own sign-in screen.
  {
    id: '002',
    path: '/login/google',
    roles: 'public',
    titleKey: 'login.title',
    Component: GoogleReturnView,
    chromeless: true,
  },
];

export default routes;
