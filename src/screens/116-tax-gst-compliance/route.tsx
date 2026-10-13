import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const TaxGstComplianceView = lazyScreen(() => import('./TaxGstComplianceView'), 'TaxGstComplianceView');

const route: ScreenRoute = {
  id: '116',
  path: '/gst-compliance',
  roles: ['admin'],
  titleKey: 'gstCompliance.title',
  Component: TaxGstComplianceView,
  tab: 'supplierPay',
};

export default route;
