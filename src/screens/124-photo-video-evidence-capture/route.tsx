import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const EvidenceCaptureView = lazyScreen(() => import('./EvidenceCaptureView'), 'EvidenceCaptureView');

const route: ScreenRoute = {
  id: '124',
  path: '/technician/jobs/:jobId/evidence',
  roles: ['technician'],
  titleKey: 'installEvidence.title',
  Component: EvidenceCaptureView,
  tab: 'jobs',
};

export default route;
