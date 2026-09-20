import { UserConvertPointSchema } from '@shared/schema/point-conversion';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { UserAuthGuard } from '#apps/user/http';
import { PointConversionUseCase } from '#modules/point';

export const PointConversionRoutes = ripple(
  {
    UserAuthGuard,
    PointConversionUseCase,
  },
  ({ UserAuthGuard, PointConversionUseCase }) =>
    new Elysia({
      name: 'PointConversionRoute',
      prefix: '/pointConversions',
      detail: {
        tags: ['PointConversion'],
      },
    })
      .use(UserAuthGuard)
      .get(
        '/',
        () => {
          return PointConversionUseCase.listVisible();
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
          return PointConversionUseCase.convert({
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
