import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { AuthRoutes } from './routes/auth';
import { OrderRoutes } from './routes/order';
import { PointAccountRoutes } from './routes/point-account';
import { PointConversionRoutes } from './routes/point-conversion';
import { PointTransactionRoutes } from './routes/point-transaction';
import { ProductRoutes } from './routes/product';
import { UserRoutes } from './routes/user';

/**
 * User HTTP 根 Ripple。
 *
 * 组合根只需要把它装进 Runtime；具体路由拓扑由本文件显式声明。
 */
export const UserHttp = ripple(
  {
    AuthRoutes,
    OrderRoutes,
    PointAccountRoutes,
    PointConversionRoutes,
    PointTransactionRoutes,
    ProductRoutes,
    UserRoutes,
  },
  routes =>
    new Elysia({
      name: 'UserHttp',
    })
      .use(routes.AuthRoutes)
      .use(routes.OrderRoutes)
      .use(routes.PointAccountRoutes)
      .use(routes.PointConversionRoutes)
      .use(routes.PointTransactionRoutes)
      .use(routes.ProductRoutes)
      .use(routes.UserRoutes),
  { debugName: 'UserHttp' },
);
