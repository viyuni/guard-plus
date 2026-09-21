import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import Point from '#modules/point';

import { UserAuthGuard } from '../auth';

export const PointAccountRoutes = ripple(
  {
    PointAccountUseCase: Point.PointAccountUseCase,
    UserAuthGuard,
  },
  ({ PointAccountUseCase, UserAuthGuard }) =>
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
  { debugName: 'PointAccountRoutes' },
);
