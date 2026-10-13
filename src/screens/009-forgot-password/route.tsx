import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ForgotPasswordView = lazyScreen(() => import('./ForgotPasswordView'), 'ForgotPasswordView');

const route: ScreenRoute = {
  id: '009',
  path: '/forgot-password',
  roles: 'public',
  titleKey: 'forgotPassword.title',
  Component: ForgotPasswordView,
  chromeless: true,
};

export default route;
