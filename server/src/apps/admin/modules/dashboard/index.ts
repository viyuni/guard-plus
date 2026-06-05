import { DashboardOverviewQuerySchema } from '@shared/schema/dashboard';
import Elysia from 'elysia';

import { appContext } from '#apps/admin/context';

export const dashboard = new Elysia({
  name: 'DashboardRoute',
  prefix: '/dashboard',
  detail: {
    tags: ['Dashboard'],
  },
})
  .use(appContext)
  .get(
    '/overview',
    ({ query, dashboardUseCase }) => {
      return dashboardUseCase.overview(query);
    },
    {
      query: DashboardOverviewQuerySchema,
      requiredAdminAuth: true,
      detail: {
        description: 'Dashboard 概览数据',
      },
    },
  );
