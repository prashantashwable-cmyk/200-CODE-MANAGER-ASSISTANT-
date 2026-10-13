import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const ServiceTicketsScreen = lazyScreen(() => import('./ServiceTicketsView'), 'ServiceTicketsScreen');

/** One request record, three views: the customer's desk (ask, follow), Admin's board (triage, book a visit, decide a warranty claim) and the technician's own visits. */
const route: ScreenRoute = { id: '175', path: '/service-requests/:ticketId?', roles: ['customer', 'admin', 'technician'], titleKey: 'serviceTickets.title', Component: ServiceTicketsScreen, tab: { customer: 'home', admin: 'home', technician: 'jobs' } };

export default route;
