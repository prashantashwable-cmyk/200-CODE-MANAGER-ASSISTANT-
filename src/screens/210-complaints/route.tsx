import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ComplaintsScreen = lazyScreen(() => import('./ComplaintsView'), 'ComplaintsScreen');

/** Complaints and service tracking: raised by the customer, acknowledged and resolved by the Owner, visible to the partner named. */
const route: ScreenRoute = {
  id: '210', path: '/complaints', roles: ['customer', 'technician', 'supplier', 'owner', 'admin'], titleKey: 'complaints.title', Component: ComplaintsScreen,
  tab: { customer: 'home', technician: 'jobs', supplier: 'orders', owner: 'analytics', admin: 'analytics' },
};

export default route;
