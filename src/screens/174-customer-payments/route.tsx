import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const CustomerPaymentsScreen = lazyScreen(() => import('./CustomerPaymentsView'), 'CustomerPaymentsScreen');

/** The customer's own payment picture, project by project: what is due and when, what has been paid, and a quiet financing option. */
const route: ScreenRoute = { id: '174', path: '/my-payments', roles: ['customer'], titleKey: 'customerPayments.title', Component: CustomerPaymentsScreen, tab: 'home' };

export default route;
