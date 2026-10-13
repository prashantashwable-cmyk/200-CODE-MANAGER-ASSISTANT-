import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const OnboardSupplierView = lazyScreen(() => import('./OnboardSupplierView'), 'OnboardSupplierView');

const route: ScreenRoute = {
  id: '007',
  path: '/onboarding/supplier',
  roles: 'public',
  titleKey: 'onbSupplier.title',
  Component: OnboardSupplierView,
  chromeless: true,
};

export default route;
