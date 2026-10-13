import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SplashView = lazyScreen(() => import('./SplashView'), 'SplashView');

const route: ScreenRoute = {
  id: '001',
  path: '/',
  roles: 'public',
  titleKey: 'splash.title',
  Component: SplashView,
  chromeless: true,
};

export default route;
