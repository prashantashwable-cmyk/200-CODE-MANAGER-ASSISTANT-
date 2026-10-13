import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const JobTeamScreen = lazyScreen(() => import('./JobTeamView'), 'JobTeamScreen');

const route: ScreenRoute = {
  id: '130',
  path: '/job-team/:jobId?',
  roles: ['technician', 'admin'],
  titleKey: 'jobTeam.title',
  Component: JobTeamScreen,
  tab: { admin: 'map', technician: 'jobs' },
};

export default route;
