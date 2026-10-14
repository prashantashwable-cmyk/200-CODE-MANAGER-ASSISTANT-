import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const MyQuoteScreen = lazyScreen(() => import('./MyQuoteView'), 'MyQuoteScreen');

/** The customer's own quote: each partner's price, the platform fee on its own line, and a tick per part to accept. */
const route: ScreenRoute = { id: '207', path: '/my-quote', roles: ['customer'], titleKey: 'myQuote.title', Component: MyQuoteScreen, tab: 'documents' };

export default route;
