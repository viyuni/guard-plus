import { ReversalTransactionSchema } from '@shared/schema/point-account';
import { TransactionPageQuerySchema } from '@shared/schema/point-transaction';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { adminAuthGuard } from '#apps/admin/http';
import { pointTransactionUseCase } from '#modules/point';

export const pointTransactionRoutes = ripple(
  {
    authGuard: adminAuthGuard,
    pointTransactionUseCase,
  },
  ({ authGuard, pointTransactionUseCase }) =>
    new Elysia({
      name: 'PointTransactionRoute',
      prefix: '/transactions',
      detail: {
        tags: ['PointTransaction'],
      },
    })
      .use(authGuard)
      .get(
        '/',
        ({ query }) => {
          return pointTransactionUseCase.pageManage(query);
        },
        {
          query: TransactionPageQuerySchema,
          requiredAdminAuth: true,
          detail: {
            description: ' 查询积分流水',
          },
        },
      )
      .patch(
        '/reversal',
        ({ auth: { id: adminId }, body }) => {
          return pointTransactionUseCase.reversal(adminId, body);
        },
        {
          body: ReversalTransactionSchema,
          requiredAdminAuth: true,
          detail: {
            description: '冲正积分流水',
          },
        },
      ),
);
