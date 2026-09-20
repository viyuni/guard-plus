import {
  AdjustBalanceSchema,
  CreateLegacyPointMigrationSchema,
  LegacyPointMigrationIdParamsSchema,
  LegacyPointMigrationPageQuerySchema,
} from '@shared/schema/point-account';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { AdminAuthGuard } from '#apps/admin/http';
import { PointAccountUseCase } from '#modules/point';

export const PointAccountRoutes = ripple(
  {
    AdminAuthGuard,
    PointAccountUseCase,
  },
  ({ AdminAuthGuard, PointAccountUseCase }) =>
    new Elysia({
      name: 'PointAccountRoute',
      prefix: '/accounts',
      detail: {
        tags: ['PointAccount'],
      },
    })
      .use(AdminAuthGuard)
      .get('/legacy-migrations', ({ query }) => PointAccountUseCase.pageLegacyMigrations(query), {
        requiredAdminAuth: true,
        query: LegacyPointMigrationPageQuerySchema,
        detail: { description: '分页查询旧平台积分迁移记录' },
      })
      .post('/legacy-migrations', ({ body }) => PointAccountUseCase.createLegacyMigration(body), {
        requiredAdminAuth: true,
        body: CreateLegacyPointMigrationSchema,
        detail: { description: '录入旧平台待迁移积分' },
      })
      .patch(
        '/legacy-migrations/:migrationId/replay',
        ({ params }) => PointAccountUseCase.replayLegacyMigration(params.migrationId),
        {
          requiredAdminAuth: true,
          params: LegacyPointMigrationIdParamsSchema,
          detail: { description: '手动回放旧平台积分迁移记录' },
        },
      )
      .delete(
        '/legacy-migrations/:migrationId',
        ({ params }) => PointAccountUseCase.deleteLegacyMigration(params.migrationId),
        {
          requiredAdminAuth: true,
          params: LegacyPointMigrationIdParamsSchema,
          detail: { description: '删除尚未回放的旧平台积分迁移记录' },
        },
      )
      .patch(
        '/balance/adjust',
        ({ auth: { id: adminId }, body }) => {
          return PointAccountUseCase.adjustBalance(adminId, body);
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
