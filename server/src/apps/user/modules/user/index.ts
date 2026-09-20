import { UserUpdatePasswordSchema, UserUpdateSchema } from '@shared/schema/user';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { UserAuthGuard } from '#apps/user/http';
import { PointConversionUseCase } from '#modules/point';
import { UserUseCase } from '#modules/user';

export const UserRoutes = ripple(
  {
    UserAuthGuard,
    PointConversionUseCase,
    UserUseCase,
  },
  ({ UserAuthGuard, PointConversionUseCase, UserUseCase }) =>
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
);
