import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const TrainingFeedbackScreen = lazyScreen(() => import('./TrainingFeedbackView'), 'TrainingFeedbackScreen');

/** Partners say how clear and relevant a training was, anonymously if they like; Admin reads the replies per training and acts on them. */
const route: ScreenRoute = { id: '160', path: '/training-feedback/:moduleId?', roles: ['admin', 'surveyor', 'technician', 'supplier'], titleKey: 'trainingFeedback.title', Component: TrainingFeedbackScreen, tab: { admin: 'partners', surveyor: 'training', technician: 'training', supplier: 'training' } };

export default route;
