import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const AgreementScreen = lazyScreen(() => import('./AgreementView'), 'AgreementScreen');

/** The partner reads and signs on their own application's link (no account yet: signing creates it); Admin prepares, sends and follows up. */
const routes: ScreenRoute[] = [
  { id: '146', path: '/agreement/:applicationId', roles: 'public', titleKey: 'agreement.title', Component: AgreementScreen, chromeless: true },
  { id: '146', path: '/offers/:applicationId?', roles: ['admin'], titleKey: 'agreement.title', Component: AgreementScreen, tab: 'partners' },
];

export default routes;
