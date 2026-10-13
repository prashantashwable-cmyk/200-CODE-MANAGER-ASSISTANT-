import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const CheckinCheckoutView = lazyScreen(() => import('./CheckinCheckoutView'), 'CheckinCheckoutView');

const route: ScreenRoute = {
  id: '125',
  path: '/technician/jobs/:jobId/checkin',
  roles: ['technician'],
  titleKey: 'siteCheckIn.title',
  Component: CheckinCheckoutView,
  tab: 'jobs',
};

export default route;
