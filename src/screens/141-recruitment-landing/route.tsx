import type { ScreenRoute } from '@/navigation/registry';
import { lazyScreen } from '@/navigation/lazyScreen';

const RecruitmentScreen = lazyScreen(() => import('./RecruitmentView'), 'RecruitmentScreen');

const route: ScreenRoute = {
  id: '141',
  path: '/join',
  roles: 'public',
  titleKey: 'recruit.title',
  Component: RecruitmentScreen,
  chromeless: true,
};

export default route;
