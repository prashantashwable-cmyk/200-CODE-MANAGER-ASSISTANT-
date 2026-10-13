import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LoanEmiApplicationView = lazyScreen(() => import('./LoanEmiApplicationView'), 'LoanEmiApplicationView');

const route: ScreenRoute = {
  id: '085',
  path: '/customer/deals/:dealId/loan-application',
  roles: ['customer'],
  titleKey: 'loanEmiApplication.title',
  Component: LoanEmiApplicationView,
  tab: 'home',
};

export default route;
