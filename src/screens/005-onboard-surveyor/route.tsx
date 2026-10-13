import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const OnboardSurveyorView = lazyScreen(() => import('./OnboardSurveyorView'), 'OnboardSurveyorView');

const route: ScreenRoute = {
  id: '005',
  path: '/onboarding/surveyor',
  roles: 'public',
  titleKey: 'onbSurveyor.title',
  Component: OnboardSurveyorView,
  chromeless: true,
};

export default route;
