import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const WalkthroughScreen = lazyScreen(() => import('./WalkthroughView'), 'WalkthroughScreen');

const route: ScreenRoute = {
  id: '138',
  path: '/handover-walkthrough/:jobId?',
  roles: ['technician', 'admin', 'customer'],
  titleKey: 'walkthrough.title',
  Component: WalkthroughScreen,
  tab: { admin: 'map', technician: 'jobs', customer: 'installation' },
};

export default route;
