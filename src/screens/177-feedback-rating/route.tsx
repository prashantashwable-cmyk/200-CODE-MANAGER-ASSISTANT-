import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const FeedbackScreen = lazyScreen(() => import('./FeedbackRatingView'), 'FeedbackScreen');

/** A short, considerate ask at the right moment, ratings that stay specific, and a person who reaches out to anyone unhappy; Admin sees the follow-up and how the team is rated. */
const route: ScreenRoute = { id: '177', path: '/feedback/:feedbackId?', roles: ['customer', 'admin'], titleKey: 'feedback.title', Component: FeedbackScreen, tab: { customer: 'home', admin: 'analytics' } };

export default route;
