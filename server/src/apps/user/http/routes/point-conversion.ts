import { UserConvertPointSchema } from '@shared/schema/point-conversion';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import Point from '#modules/point';

import { UserAuthGuard } from '../auth';

export const PointConversionRoutes = ripple(
  {
    PointConversionUseCase: Point.PointConversionUseCase,
    UserAuthGuard,
  },
  ({ PointConversionUseCase, UserAuthGuard }) =>
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
  { debugName: 'PointConversionRoutes' },
);
