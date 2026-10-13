import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const HelpScreen = lazyScreen(() => import('./HelpView'), 'HelpScreen');

/** Self-service help for every role: the articles written for your own role, a way to say whether they helped, and a path to a person when they do not. */
const route: ScreenRoute = {
  id: '199',
  path: '/help',
  roles: ['admin', 'surveyor', 'technician', 'customer', 'supplier'],
  titleKey: 'help.title',
  Component: HelpScreen,
  tab: { admin: 'settings', customer: 'settings', technician: 'settings', supplier: 'settings', surveyor: 'home' },
};

export default route;
