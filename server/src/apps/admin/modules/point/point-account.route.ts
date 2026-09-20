import {
  AdjustBalanceSchema,
  CreateLegacyPointMigrationSchema,
  LegacyPointMigrationIdParamsSchema,
  LegacyPointMigrationPageQuerySchema,
} from '@shared/schema/point-account';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { adminAuthGuard } from '#apps/admin/http';
import { pointAccountUseCase } from '#modules/point';

export const pointAccountRoutes = ripple(
  {
    authGuard: adminAuthGuard,
    pointAccountUseCase,
  },
  ({ authGuard, pointAccountUseCase }) =>
    new Elysia({
      name: 'PointAccountRoute',
      prefix: '/accounts',
      detail: {
        tags: ['PointAccount'],
      },
    })
      .use(authGuard)
      .get('/legacy-migrations', ({ query }) => pointAccountUseCase.pageLegacyMigrations(query), {
        requiredAdminAuth: true,
        query: LegacyPointMigrationPageQuerySchema,
        detail: { description: '分页查询旧平台积分迁移记录' },
      })
      .post('/legacy-migrations', ({ body }) => pointAccountUseCase.createLegacyMigration(body), {
        requiredAdminAuth: true,
        body: CreateLegacyPointMigrationSchema,
        detail: { description: '录入旧平台待迁移积分' },
      })
      .patch(
        '/legacy-migrations/:migrationId/replay',
        ({ params }) => pointAccountUseCase.replayLegacyMigration(params.migrationId),
        {
          requiredAdminAuth: true,
          params: LegacyPointMigrationIdParamsSchema,
          detail: { description: '手动回放旧平台积分迁移记录' },
        },
      )
      .delete(
        '/legacy-migrations/:migrationId',
        ({ params }) => pointAccountUseCase.deleteLegacyMigration(params.migrationId),
        {
          requiredAdminAuth: true,
          params: LegacyPointMigrationIdParamsSchema,
          detail: { description: '删除尚未回放的旧平台积分迁移记录' },
        },
      )
      .patch(
        '/balance/adjust',
        ({ auth: { id: adminId }, body }) => {
          return pointAccountUseCase.adjustBalance(adminId, body);
        },
        {
          requiredAdminAuth: true,
          body: AdjustBalanceSchema,
          detail: {
            description: ' 账号积分调整',
          },
        },
      ),
);
