import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { PointAccountRoutes } from './account';
import { PointConversionRoutes } from './conversion';
import { PointTransactionRoutes } from './transaction';
import { PointTypeRoutes } from './type';

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
  { debugName: 'PointRoutes' },
);
