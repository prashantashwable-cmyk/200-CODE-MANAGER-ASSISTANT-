import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const EsignatureCaptureView = lazyScreen(() => import('./EsignatureCaptureView'), 'EsignatureCaptureView');

const route: ScreenRoute = {
  id: '076',
  path: '/admin/deals/:dealId/signature',
  roles: ['admin'],
  titleKey: 'esignatureCapture.title',
  Component: EsignatureCaptureView,
  tab: 'deals',
};

export default route;
