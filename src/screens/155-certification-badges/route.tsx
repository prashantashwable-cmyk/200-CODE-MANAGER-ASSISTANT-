import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const CertificationsScreen = lazyScreen(() => import('./CertificationsView'), 'CertificationsScreen');

/** A partner's own certifications: what they hold, what is ending, what to do next, and a credential to keep. */
const route: ScreenRoute = { id: '155', path: '/certifications', roles: ['surveyor', 'technician', 'supplier'], titleKey: 'certifications.title', Component: CertificationsScreen, tab: 'training' };

export default route;
