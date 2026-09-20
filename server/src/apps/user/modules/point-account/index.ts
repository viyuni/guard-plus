import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { userAuthGuard } from '#apps/user/http';
import { pointAccountUseCase } from '#modules/point';

export const pointAccountRoutes = ripple(
  {
    authGuard: userAuthGuard,
    pointAccountUseCase,
  },
  ({ authGuard, pointAccountUseCase }) =>
    new Elysia({
      name: 'PointAccountRoute',
      prefix: '/pointAccounts',
      detail: {
        tags: ['PointAccount'],
      },
    })
      .use(authGuard)
      .get(
        '/',
        ({ auth: { id: userId } }) => {
          return pointAccountUseCase.listMine(userId);
        },
        {
          requiredAuth: true,
          detail: {
            description: '我的积分余额',
          },
        },
      ),
);
