import { DashboardOverviewQuerySchema } from '@shared/schema/dashboard';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { AdminAuthGuard } from '#apps/admin/http';
import { DashboardUseCase } from '#modules/dashboard';

export const DashboardRoutes = ripple(
  {
    AdminAuthGuard,
    DashboardUseCase,
  },
  ({ AdminAuthGuard, DashboardUseCase }) =>
    new Elysia({
      name: 'DashboardRoute',
      prefix: '/dashboard',
      detail: {
        tags: ['Dashboard'],
      },
    })
      .use(AdminAuthGuard)
      .get(
        '/overview',
        ({ query }) => {
          return DashboardUseCase.overview(query);
        },
        {
          query: DashboardOverviewQuerySchema,
          requiredAdminAuth: true,
          detail: {
            description: 'Dashboard 概览数据',
          },
        },
      ),
);
