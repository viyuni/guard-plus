import { UserUpdatePasswordSchema, UserUpdateSchema } from '@shared/schema/user';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import Point from '#modules/point';
import User from '#modules/user';

import { UserAuthGuard } from '../auth';

export const UserRoutes = ripple(
  {
    PointConversionUseCase: Point.PointConversionUseCase,
    UserAuthGuard,
    UserUseCase: User.UserUseCase,
  },
  ({ PointConversionUseCase, UserAuthGuard, UserUseCase }) =>
    new Elysia({
      name: 'UserRoute',
    })
      .use(UserAuthGuard)
      .get(
        '/me',
        async ({ auth: { id: userId } }) => {
          const [user, pointConversionRules] = await Promise.all([
            UserUseCase.getDetail(userId),
            PointConversionUseCase.listVisible(),
          ]);

          return {
            ...user,
            pointConversionRules,
          };
        },
        {
          requiredAuth: true,
          detail: {
            tags: ['User'],
            summary: '当前用户信息',
          },
        },
      )
      .put('/me', ({ auth: { id: userId }, body }) => UserUseCase.update(userId, body), {
        body: UserUpdateSchema,
        requiredAuth: true,
        detail: {
          tags: ['User'],
          summary: '更新当前用户信息',
        },
      })
      .patch(
        '/me/password',
        ({ auth: { id: userId }, body }) => UserUseCase.updatePassword(userId, body),
        {
          body: UserUpdatePasswordSchema,
          requiredAuth: true,
          detail: {
            tags: ['User'],
            summary: '修改当前用户密码',
          },
        },
      ),
  { debugName: 'UserRoutes' },
);
