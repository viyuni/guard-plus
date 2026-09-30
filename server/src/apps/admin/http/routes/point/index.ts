import { ripple } from 'cyrenex';
import Elysia from 'elysia';

import { PointAccountRoutes } from './account';
import { PointConversionRoutes } from './conversion';
import { PointTransactionRoutes } from './transaction';
import { PointTypeRoutes } from './type';

export const PointRoutes = ripple(
  'PointRoutes',
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
