import { UserConvertPointSchema } from '@shared/schema/point-conversion';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { userAuthGuard } from '#apps/user/http';
import { pointConversionUseCase } from '#modules/point';

export const pointConversionRoutes = ripple(
  {
    authGuard: userAuthGuard,
    pointConversionUseCase,
  },
  ({ authGuard, pointConversionUseCase }) =>
    new Elysia({
      name: 'PointConversionRoute',
      prefix: '/pointConversions',
      detail: {
        tags: ['PointConversion'],
      },
    })
      .use(authGuard)
      .get(
        '/',
        () => {
          return pointConversionUseCase.listVisible();
        },
        {
          requiredAuth: true,
          detail: {
            description: '积分转换规则列表',
          },
        },
      )
      .post(
        '/convert',
        ({ auth: { id: userId }, body }) => {
          return pointConversionUseCase.convert({
            ...body,
            userId,
          });
        },
        {
          body: UserConvertPointSchema,
          requiredAuth: true,
          detail: {
            description: '执行积分转换',
          },
        },
      ),
);
