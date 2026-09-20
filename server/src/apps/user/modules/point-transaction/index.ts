import { TransactionPageQuerySchema } from '@shared/schema/point-transaction';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { userAuthGuard } from '#apps/user/http';
import { pointTransactionUseCase } from '#modules/point';

export const pointTransactionRoutes = ripple(
  {
    authGuard: userAuthGuard,
    pointTransactionUseCase,
  },
  ({ authGuard, pointTransactionUseCase }) =>
    new Elysia({
      name: 'PointTransactionRoute',
      prefix: '/pointTransactions',
      detail: {
        tags: ['PointTransaction'],
      },
    })
      .use(authGuard)
      .get(
        '/',
        ({ query, auth: { id: userId } }) => {
          return pointTransactionUseCase.pageMine(userId, query);
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
