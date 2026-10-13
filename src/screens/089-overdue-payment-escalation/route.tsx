import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const OverduePaymentEscalationView = lazyScreen(() => import('./OverduePaymentEscalationView'), 'OverduePaymentEscalationView');

const route: ScreenRoute = {
  id: '089',
  path: '/admin/analytics/collections/escalation',
  roles: ['admin'],
  titleKey: 'overduePaymentEscalation.title',
  Component: OverduePaymentEscalationView,
  tab: 'analytics',
};

export default route;
