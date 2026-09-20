import { ReversalTransactionSchema } from '@shared/schema/point-account';
import { TransactionPageQuerySchema } from '@shared/schema/point-transaction';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { AdminAuthGuard } from '#apps/admin/http';
import { PointTransactionUseCase } from '#modules/point';

export const PointTransactionRoutes = ripple(
  {
    AdminAuthGuard,
    PointTransactionUseCase,
  },
  ({ AdminAuthGuard, PointTransactionUseCase }) =>
    new Elysia({
      name: 'PointTransactionRoute',
      prefix: '/transactions',
      detail: {
        tags: ['PointTransaction'],
      },
    })
      .use(AdminAuthGuard)
      .get(
        '/',
        ({ query }) => {
          return PointTransactionUseCase.pageManage(query);
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
          return PointTransactionUseCase.reversal(adminId, body);
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
