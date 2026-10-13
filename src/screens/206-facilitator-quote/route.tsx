import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const FacilitatorQuoteScreen = lazyScreen(() => import('./FacilitatorQuoteView'), 'FacilitatorQuoteScreen');

/** Build an itemised quote: each partner's own price, plus a platform fee shown on its own line. The Owner sets the fee; Admin prepares. */
const route: ScreenRoute = { id: '206', path: '/quotes', roles: ['owner', 'admin'], titleKey: 'facQuote.title', Component: FacilitatorQuoteScreen, tab: 'analytics' };

export default route;
