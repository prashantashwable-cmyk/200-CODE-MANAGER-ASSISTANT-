import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const WhatsappConsoleView = lazyScreen(() => import('./WhatsappConsoleView'), 'WhatsappConsoleView');

const route: ScreenRoute = {
  id: '053',
  path: '/admin/comm/whatsapp',
  roles: ['admin'],
  titleKey: 'whatsappConsole.title',
  Component: WhatsappConsoleView,
  tab: 'comm',
};

export default route;
