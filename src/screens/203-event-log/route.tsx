import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const EventLogScreen = lazyScreen(() => import('./EventLogView'), 'EventLogScreen');

/** The Activity Log: the same event stream the map is drawn from, scoped to what each role may see. Corrections never overwrite. */
const route: ScreenRoute = {
  id: '203',
  path: '/log',
  roles: ['owner', 'admin', 'surveyor', 'technician', 'customer', 'supplier'],
  titleKey: 'eventLog.title',
  Component: EventLogScreen,
  tab: { owner: 'log', admin: 'home', surveyor: 'home', technician: 'home', customer: 'home', supplier: 'orders' },
};

export default route;
