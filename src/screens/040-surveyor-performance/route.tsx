import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SurveyorPerformanceView = lazyScreen(() => import('./SurveyorPerformanceView'), 'SurveyorPerformanceView');

const route: ScreenRoute = {
  id: '040',
  path: '/surveyor/performance',
  roles: ['surveyor'],
  titleKey: 'surveyorPerformance.title',
  Component: SurveyorPerformanceView,
  tab: 'home',
};

export default route;
