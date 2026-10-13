import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LeadScoringView = lazyScreen(() => import('./LeadScoringView'), 'LeadScoringView');

const route: ScreenRoute = {
  id: '046',
  path: '/admin/leads/scoring',
  roles: ['admin'],
  titleKey: 'leadScoring.title',
  Component: LeadScoringView,
  tab: 'leads',
};

export default route;
