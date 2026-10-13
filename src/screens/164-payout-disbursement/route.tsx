import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const PayoutDisbursementScreen = lazyScreen(() => import('./PayoutDisbursementView'), 'PayoutDisbursementScreen');

/** Where cleared payouts actually go: the weekly run, urgent sends, what failed and why, and the history that reconciliation reads. */
const route: ScreenRoute = { id: '164', path: '/payout-disbursement', roles: ['admin'], titleKey: 'payoutDisbursement.title', Component: PayoutDisbursementScreen, tab: 'partners' };

export default route;
