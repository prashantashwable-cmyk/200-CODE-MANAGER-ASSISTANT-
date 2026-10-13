import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const WorkflowRulesScreen = lazyScreen(() => import('./WorkflowRulesView'), 'WorkflowRulesScreen');

/** The plain-language escape hatch for automation needs no dedicated screen covers: a library of custom rules and a builder that tests before it activates. */
const route: ScreenRoute = { id: '182', path: '/workflow-rules/:ruleId?', roles: ['admin'], titleKey: 'workflowRules.title', Component: WorkflowRulesScreen, tab: 'analytics' };

export default route;
