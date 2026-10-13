import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const EscalationView = lazyScreen(() => import('./EscalationView'), 'EscalationView');

const route: ScreenRoute = {
  id: '019',
  path: '/admin/escalations',
  roles: ['admin'],
  titleKey: 'escalation.title',
  Component: EscalationView,
  tab: 'alerts',
};

export default route;
