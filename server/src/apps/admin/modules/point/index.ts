import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { PointAccountRoutes } from './point-account.route';
import { PointConversionRoutes } from './point-conversion.route';
import { PointTransactionRoutes } from './point-transaction.route';
import { PointTypeRoutes } from './point-type.route';

export const PointRoutes = ripple(
  {
    PointAccountRoutes,
    PointConversionRoutes,
    PointTransactionRoutes,
    PointTypeRoutes,
  },
  routes =>
    new Elysia({
      name: 'PointRoute',
      prefix: '/points',
      detail: {
        tags: ['Point'],
      },
    })
      .use(routes.PointTypeRoutes)
      .use(routes.PointAccountRoutes)
      .use(routes.PointConversionRoutes)
      .use(routes.PointTransactionRoutes),
);
