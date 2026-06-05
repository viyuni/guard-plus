import { UserUpdateSchema } from '@shared/schema/user';
import Elysia from 'elysia';

import { appContext } from '#apps/user/context';

export const user = new Elysia({
  name: 'UserRoute',
})
  .use(appContext)
  .get(
    '/me',
    async ({ auth: { id: userId }, pointConversionUseCase, userUseCase }) => {
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
  .put('/me', ({ auth: { id: userId }, body, userUseCase }) => userUseCase.update(userId, body), {
    body: UserUpdateSchema,
    requiredAuth: true,
    detail: {
      tags: ['User'],
      summary: '更新当前用户信息',
    },
  });
