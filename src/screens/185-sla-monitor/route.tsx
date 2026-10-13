import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SlaMonitorScreen = lazyScreen(() => import('./SlaMonitorView'), 'SlaMonitorScreen');

/** Every SLA-governed process in one place: status against its own target, the breaches to start with, the trend, and whether a target still fits. */
const route: ScreenRoute = { id: '185', path: '/sla-monitor', roles: ['admin'], titleKey: 'slaMonitor.title', Component: SlaMonitorScreen, tab: 'analytics' };

export default route;
