import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const SupportChatScreen = lazyScreen(() => import('./SupportChatView'), 'SupportChatScreen');

/** The customer's post-sale chat (assistant first, a person whenever it is needed) and the agent's board and thread, with the customer's whole picture beside each conversation. */
const route: ScreenRoute = { id: '176', path: '/support-chat/:conversationId?', roles: ['customer', 'admin'], titleKey: 'supportChat.title', Component: SupportChatScreen, tab: { customer: 'home', admin: 'comm' } };

export default route;
