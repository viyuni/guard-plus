import { TransactionPageQuerySchema } from '@shared/schema/point-transaction';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { UserAuthGuard } from '#apps/user/http';
import { PointTransactionUseCase } from '#modules/point';

export const PointTransactionRoutes = ripple(
  {
    UserAuthGuard,
    PointTransactionUseCase,
  },
  ({ UserAuthGuard, PointTransactionUseCase }) =>
    new Elysia({
      name: 'PointTransactionRoute',
      prefix: '/pointTransactions',
      detail: {
        tags: ['PointTransaction'],
      },
    })
      .use(UserAuthGuard)
      .get(
        '/',
        ({ query, auth: { id: userId } }) => {
          return PointTransactionUseCase.pageMine(userId, query);
        },
        {
          query: TransactionPageQuerySchema,
          requiredAuth: true,
          detail: {
            description: '我的积分流水',
          },
        },
      ),
);
