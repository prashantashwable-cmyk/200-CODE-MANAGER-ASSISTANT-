import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const OnboardTechnicianView = lazyScreen(() => import('./OnboardTechnicianView'), 'OnboardTechnicianView');

const route: ScreenRoute = {
  id: '006',
  path: '/onboarding/technician',
  roles: 'public',
  titleKey: 'onbTechnician.title',
  Component: OnboardTechnicianView,
  chromeless: true,
};

export default route;
