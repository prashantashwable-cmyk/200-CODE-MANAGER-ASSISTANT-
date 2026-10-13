import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const AssessmentScreen = lazyScreen(() => import('./AssessmentView'), 'AssessmentScreen');

/** A partner sits the test that follows a module (`/assessment/:moduleId`); Admin, with no module, sees how every test is doing and the pass mark and cooldowns. */
const route: ScreenRoute = { id: '154', path: '/assessment/:moduleId?', roles: ['surveyor', 'technician', 'supplier', 'admin'], titleKey: 'assessment.title', Component: AssessmentScreen, tab: { admin: 'partners', technician: 'training', surveyor: 'training', supplier: 'training' } };

export default route;
