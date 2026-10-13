import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const DuplicateMergeView = lazyScreen(() => import('./DuplicateMergeView'), 'DuplicateMergeView');

const route: ScreenRoute = {
  id: '045',
  path: '/admin/leads/duplicates',
  roles: ['admin'],
  titleKey: 'duplicateMerge.title',
  Component: DuplicateMergeView,
  tab: 'leads',
};

export default route;
