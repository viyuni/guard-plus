import { DashboardOverviewQuerySchema } from '@shared/schema/dashboard';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { adminAuthGuard } from '#apps/admin/http';
import { dashboardUseCase } from '#modules/dashboard';

export const dashboardRoutes = ripple(
  {
    authGuard: adminAuthGuard,
    dashboardUseCase,
  },
  ({ authGuard, dashboardUseCase }) =>
    new Elysia({
      name: 'DashboardRoute',
      prefix: '/dashboard',
      detail: {
        tags: ['Dashboard'],
      },
    })
      .use(authGuard)
      .get(
        '/overview',
        ({ query }) => {
          return dashboardUseCase.overview(query);
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
