import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const CaptureContactView = lazyScreen(() => import('./CaptureContactView'), 'CaptureContactView');

const route: ScreenRoute = {
  id: '033',
  path: '/surveyor/capture/contact',
  roles: ['surveyor'],
  titleKey: 'captureContact.title',
  Component: CaptureContactView,
  tab: 'capture',
};

export default route;
