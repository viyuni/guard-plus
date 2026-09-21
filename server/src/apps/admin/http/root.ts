import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { AdminRoutes } from './routes/admin';
import { AdminAuthRoutes } from './routes/auth';
import { DashboardRoutes } from './routes/dashboard';
import { AdminOrderRoutes } from './routes/order';
import { PointRoutes } from './routes/point';
import { AdminProductRoutes } from './routes/product';
import { RewardRoutes } from './routes/reward';
import { AdminUserRoutes } from './routes/user';

/**
 * Admin HTTP 根 Ripple。
 *
 * 组合根只需要把它装进 Runtime；具体路由拓扑由本文件显式声明。
 */
export const AdminHttp = ripple(
  {
    AdminAuthRoutes,
    AdminOrderRoutes,
    AdminProductRoutes,
    AdminRoutes,
    AdminUserRoutes,
    DashboardRoutes,
    PointRoutes,
    RewardRoutes,
  },
  routes =>
    new Elysia({
      name: 'AdminHttp',
    })
      .use(routes.AdminAuthRoutes)
      .use(routes.DashboardRoutes)
      .use(routes.AdminRoutes)
      .use(routes.PointRoutes)
      .use(routes.RewardRoutes)
      .use(routes.AdminProductRoutes)
      .use(routes.AdminOrderRoutes)
      .use(routes.AdminUserRoutes),
  { debugName: 'AdminHttp' },
);
