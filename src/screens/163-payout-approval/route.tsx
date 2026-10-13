import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const PayoutApprovalScreen = lazyScreen(() => import('./PayoutApprovalView'), 'PayoutApprovalScreen');

/** The checkpoint before a worker payout goes out: Admin looks at the exceptions, clears the routine ones together and holds anything that needs a second look. */
const route: ScreenRoute = { id: '163', path: '/payout-approval', roles: ['admin'], titleKey: 'payoutApproval.title', Component: PayoutApprovalScreen, tab: 'partners' };

export default route;
