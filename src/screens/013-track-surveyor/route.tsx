import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const TrackSurveyorView = lazyScreen(() => import('./TrackSurveyorView'), 'TrackSurveyorView');

const route: ScreenRoute = {
  id: '013',
  path: '/admin/tracking/surveyor/:userId',
  roles: ['admin'],
  titleKey: 'trackSurveyor.title',
  Component: TrackSurveyorView,
  tab: 'map',
};

export default route;
