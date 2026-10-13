import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const InterviewScreen = lazyScreen(() => import('./InterviewView'), 'InterviewScreen');

/** The applicant reaches their own interview time by their application's link (no account yet); Admin has the calendar and each applicant's record. */
const routes: ScreenRoute[] = [
  { id: '144', path: '/interview/:applicationId', roles: 'public', titleKey: 'interview.title', Component: InterviewScreen, chromeless: true },
  { id: '144', path: '/interviews/:applicationId?', roles: ['admin'], titleKey: 'interview.title', Component: InterviewScreen, tab: 'partners' },
];

export default routes;
