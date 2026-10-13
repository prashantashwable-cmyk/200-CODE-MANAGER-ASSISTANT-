import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupplierAgreementView = lazyScreen(() => import('./SupplierAgreementView'), 'SupplierAgreementView');

const route: ScreenRoute = {
  id: '098',
  path: '/agreement',
  roles: ['admin', 'supplier'],
  titleKey: 'supplierAgreement.title',
  Component: SupplierAgreementView,
  tab: { admin: 'suppliers', supplier: 'agreement' },
};

export default route;
