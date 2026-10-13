import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const LeadImportExportView = lazyScreen(() => import('./LeadImportExportView'), 'LeadImportExportView');

const route: ScreenRoute = {
  id: '050',
  path: '/admin/leads/import-export',
  roles: ['admin'],
  titleKey: 'leadImportExport.title',
  Component: LeadImportExportView,
  tab: 'leads',
};

export default route;
