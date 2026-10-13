import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const OtpView = lazyScreen(() => import('./OtpView'), 'OtpView');

const route: ScreenRoute = {
  id: '003',
  path: '/login/otp',
  roles: 'public',
  titleKey: 'otp.title',
  Component: OtpView,
  chromeless: true,
};

export default route;
