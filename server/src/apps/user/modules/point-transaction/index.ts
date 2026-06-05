import { TransactionPageQuerySchema } from '@shared/schema/point-transaction';
import Elysia from 'elysia';

import { appContext } from '#apps/user/context';

export const pointTransaction = new Elysia({
  name: 'PointTransactionRoute',
  prefix: '/pointTransactions',
  detail: {
    tags: ['PointTransaction'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ query, pointTransactionUseCase, auth: { id: userId } }) => {
      return pointTransactionUseCase.pageMine(userId, query);
    },
    {
      query: TransactionPageQuerySchema,
      requiredAuth: true,
      detail: {
        description: '我的积分流水',
      },
    },
  );
