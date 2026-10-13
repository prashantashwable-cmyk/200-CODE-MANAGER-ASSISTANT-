import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const PayoutHistoryScreen = lazyScreen(() => import('./PayoutHistoryView'), 'PayoutHistoryScreen');

/** A partner's own record of everything they have earned from AIEC, where each payout stands, a statement to keep, and a way to ask about anything that looks wrong. */
const route: ScreenRoute = { id: '168', path: '/payout-history', roles: ['surveyor', 'technician', 'supplier'], titleKey: 'payoutHistory.title', Component: PayoutHistoryScreen, tab: { surveyor: 'earnings', technician: 'home', supplier: 'payments' } };

export default route;
