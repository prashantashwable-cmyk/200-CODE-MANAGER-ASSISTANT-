import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const AppInfoScreen = lazyScreen(() => import('./AppInfoView'), 'AppInfoScreen');

/** The app's version and what changed in plain words, an update prompt that is honest about the device, and a home for ideas about the app itself. */
const route: ScreenRoute = {
  id: '200',
  path: '/app-info',
  roles: ['admin', 'surveyor', 'technician', 'customer', 'supplier'],
  titleKey: 'appInfo.title',
  Component: AppInfoScreen,
  tab: { admin: 'settings', customer: 'settings', technician: 'settings', supplier: 'settings', surveyor: 'home' },
};

export default route;
