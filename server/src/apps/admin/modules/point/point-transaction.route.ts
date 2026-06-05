import { ReversalTransactionSchema } from '@shared/schema/point-account';
import { TransactionPageQuerySchema } from '@shared/schema/point-transaction';
import Elysia from 'elysia';

import { appContext } from '#apps/admin/context';

export const pointTransactionRoute = new Elysia({
  name: 'PointTransactionRoute',
  prefix: '/transactions',
  detail: {
    tags: ['PointTransaction'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ pointTransactionUseCase, query }) => {
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
    ({ pointTransactionUseCase, auth: { id: adminId }, body }) => {
      return pointTransactionUseCase.reversal(adminId, body);
    },
    {
      body: ReversalTransactionSchema,
      requiredAdminAuth: true,
      detail: {
        description: '冲正积分流水',
      },
    },
  );
