import { TransactionPageQuerySchema } from '@shared/schema/point-transaction';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import Point from '#modules/point';

import { UserAuthGuard } from '../auth';

export const PointTransactionRoutes = ripple(
  {
    PointTransactionUseCase: Point.PointTransactionUseCase,
    UserAuthGuard,
  },
  ({ PointTransactionUseCase, UserAuthGuard }) =>
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
  { debugName: 'PointTransactionRoutes' },
);
