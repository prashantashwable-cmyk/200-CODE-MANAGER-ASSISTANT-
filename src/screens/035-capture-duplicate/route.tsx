import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const CaptureDuplicateView = lazyScreen(() => import('./CaptureDuplicateView'), 'CaptureDuplicateView');

const route: ScreenRoute = {
  id: '035',
  path: '/surveyor/capture/duplicate',
  roles: ['surveyor'],
  titleKey: 'captureDuplicate.title',
  Component: CaptureDuplicateView,
  tab: 'capture',
};

export default route;
