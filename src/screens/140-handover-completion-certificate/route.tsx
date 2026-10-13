import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const CompletionScreen = lazyScreen(() => import('./CompletionView'), 'CompletionScreen');

const route: ScreenRoute = {
  id: '140',
  path: '/handover-certificate/:jobId?',
  roles: ['admin', 'customer'],
  titleKey: 'completion.title',
  Component: CompletionScreen,
  tab: { admin: 'map', customer: 'installation' },
};

export default route;
