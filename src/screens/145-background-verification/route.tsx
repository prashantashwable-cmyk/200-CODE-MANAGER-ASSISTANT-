import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const VerificationScreen = lazyScreen(() => import('./VerificationView'), 'VerificationScreen');

const route: ScreenRoute = { id: '145', path: '/verification/:applicationId?', roles: ['admin'], titleKey: 'verification.title', Component: VerificationScreen, tab: 'partners' };

export default route;
