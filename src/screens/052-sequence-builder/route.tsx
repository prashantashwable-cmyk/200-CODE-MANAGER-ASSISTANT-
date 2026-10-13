import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SequenceBuilderView = lazyScreen(() => import('./SequenceBuilderView'), 'SequenceBuilderView');

const route: ScreenRoute = {
  id: '052',
  path: '/admin/comm/sequences',
  roles: ['admin'],
  titleKey: 'sequenceBuilder.title',
  Component: SequenceBuilderView,
  tab: 'comm',
};

export default route;
