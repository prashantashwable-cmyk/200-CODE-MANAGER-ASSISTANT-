import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const TdsStatementScreen = lazyScreen(() => import('./TdsStatementView'), 'TdsStatementScreen');

/** The tax AIEC deducts at source from partner payouts: each partner's own statement and certificates, and Admin's aggregate for deposits, returns, rates and PANs. */
const route: ScreenRoute = { id: '169', path: '/tds-statement', roles: ['surveyor', 'technician', 'supplier', 'admin'], titleKey: 'tdsStatement.title', Component: TdsStatementScreen, tab: { surveyor: 'earnings', technician: 'home', supplier: 'payments', admin: 'analytics' } };

export default route;
