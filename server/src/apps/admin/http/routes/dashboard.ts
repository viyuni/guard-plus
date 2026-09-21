import { DashboardOverviewQuerySchema } from '@shared/schema/dashboard';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import Dashboard from '#modules/dashboard';

import { AdminAuthGuard } from '../auth';

export const DashboardRoutes = ripple(
  {
    AdminAuthGuard,
    DashboardUseCase: Dashboard.DashboardUseCase,
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
  { debugName: 'DashboardRoutes' },
);
