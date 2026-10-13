import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const PayoutDisputeScreen = lazyScreen(() => import('./PayoutDisputeView'), 'PayoutDisputeScreen');

/** A partner asks about, or disputes, one payout; Admin settles it in a queue with a target time, a documented decision and a correction through the ledger. */
const route: ScreenRoute = { id: '170', path: '/payout-dispute', roles: ['surveyor', 'technician', 'supplier', 'admin'], titleKey: 'payoutDispute.title', Component: PayoutDisputeScreen, tab: { surveyor: 'earnings', technician: 'home', supplier: 'payments', admin: 'partners' } };

export default route;
