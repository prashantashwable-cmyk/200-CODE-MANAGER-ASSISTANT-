import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SopRepositoryScreen = lazyScreen(() => import('./SopRepositoryView'), 'SopRepositoryScreen');

/** Technicians (and the QC inspectors among them) read the procedures they are held to; Admin reads them too and adds documents for new categories. */
const route: ScreenRoute = { id: '153', path: '/sops/:docId?', roles: ['technician', 'admin'], titleKey: 'sopRepo.title', Component: SopRepositoryScreen, tab: { admin: 'partners', technician: 'training' } };

export default route;
