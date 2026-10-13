import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LoanPartnerIntegrationStatusView = lazyScreen(() => import('./LoanPartnerIntegrationStatusView'), 'LoanPartnerIntegrationStatusView');

const route: ScreenRoute = {
  id: '086',
  path: '/admin/analytics/financing',
  roles: ['admin'],
  titleKey: 'loanPartnerStatus.title',
  Component: LoanPartnerIntegrationStatusView,
  tab: 'analytics',
};

export default route;
