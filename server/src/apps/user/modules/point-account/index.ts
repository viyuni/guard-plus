import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { UserAuthGuard } from '#apps/user/http';
import { PointAccountUseCase } from '#modules/point';

export const PointAccountRoutes = ripple(
  {
    UserAuthGuard,
    PointAccountUseCase,
  },
  ({ UserAuthGuard, PointAccountUseCase }) =>
    new Elysia({
      name: 'PointAccountRoute',
      prefix: '/pointAccounts',
      detail: {
        tags: ['PointAccount'],
      },
    })
      .use(UserAuthGuard)
      .get(
        '/',
        ({ auth: { id: userId } }) => {
          return PointAccountUseCase.listMine(userId);
        },
        {
          requiredAuth: true,
          detail: {
            description: '我的积分余额',
          },
        },
      ),
);
