import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const OnboardCustomerView = lazyScreen(() => import('./OnboardCustomerView'), 'OnboardCustomerView');

const route: ScreenRoute = {
  id: '008',
  path: '/onboarding/customer',
  roles: 'public',
  titleKey: 'onbCustomer.title',
  Component: OnboardCustomerView,
  chromeless: true,
};

export default route;
