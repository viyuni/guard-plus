import Elysia from 'elysia';

import { appContext } from '#apps/user/context';

export const pointAccount = new Elysia({
  name: 'PointAccountRoute',
  prefix: '/pointAccounts',
  detail: {
    tags: ['PointAccount'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ auth: { id: userId }, pointAccountUseCase }) => {
      return pointAccountUseCase.listMine(userId);
    },
    {
      requiredAuth: true,
      detail: {
        description: '我的积分余额',
      },
    },
  );
