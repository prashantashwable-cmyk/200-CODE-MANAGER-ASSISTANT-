import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const QuickCaptureScreen = lazyScreen(() => import('./QuickCaptureView'), 'QuickCaptureScreen');

/** Capture a construction site from the map in a few taps. Works without signal: it waits on the phone, keeps its own time, and sends when it can. */
const route: ScreenRoute = { id: '205', path: '/capture', roles: ['surveyor', 'owner'], titleKey: 'quickCapture.title', Component: QuickCaptureScreen, tab: { surveyor: 'capture', owner: 'map' } };

export default route;
