import { UserUpdatePasswordSchema, UserUpdateSchema } from '@shared/schema/user';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { userAuthGuard } from '#apps/user/http';
import { pointConversionUseCase } from '#modules/point';
import { userUseCase } from '#modules/user';

export const userRoutes = ripple(
  {
    authGuard: userAuthGuard,
    pointConversionUseCase,
    userUseCase,
  },
  ({ authGuard, pointConversionUseCase, userUseCase }) =>
    new Elysia({
      name: 'UserRoute',
    })
      .use(authGuard)
      .get(
        '/me',
        async ({ auth: { id: userId } }) => {
          const [user, pointConversionRules] = await Promise.all([
            userUseCase.getDetail(userId),
            pointConversionUseCase.listVisible(),
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
      .put('/me', ({ auth: { id: userId }, body }) => userUseCase.update(userId, body), {
        body: UserUpdateSchema,
        requiredAuth: true,
        detail: {
          tags: ['User'],
          summary: '更新当前用户信息',
        },
      })
      .patch(
        '/me/password',
        ({ auth: { id: userId }, body }) => userUseCase.updatePassword(userId, body),
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
