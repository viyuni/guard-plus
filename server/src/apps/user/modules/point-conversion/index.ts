import { UserConvertPointSchema } from '@shared/schema/point-conversion';
import Elysia from 'elysia';

import { appContext } from '#apps/user/context';

export const pointConversion = new Elysia({
  name: 'PointConversionRoute',
  prefix: '/pointConversions',
  detail: {
    tags: ['PointConversion'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ pointConversionUseCase }) => {
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
    ({ auth: { id: userId }, body, pointConversionUseCase }) => {
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
  );
