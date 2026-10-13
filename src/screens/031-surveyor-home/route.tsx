import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SurveyorHomeView = lazyScreen(() => import('./SurveyorHomeView'), 'SurveyorHomeView');

const route: ScreenRoute = {
  id: '031',
  path: '/surveyor',
  roles: ['surveyor'],
  titleKey: 'surveyorHome.title',
  Component: SurveyorHomeView,
  tab: 'home',
};

export default route;
