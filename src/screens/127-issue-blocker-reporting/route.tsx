import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const IssueReportingView = lazyScreen(() => import('./IssueReportingView'), 'IssueReportingView');

const route: ScreenRoute = {
  id: '127',
  path: '/job-issues/:jobId?',
  roles: ['technician', 'admin'],
  titleKey: 'issueReport.title',
  Component: IssueReportingView,
  tab: { admin: 'map', technician: 'jobs' },
};

export default route;
