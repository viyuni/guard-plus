import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { pointAccountRoutes } from './point-account.route';
import { pointConversionRoutes } from './point-conversion.route';
import { pointTransactionRoutes } from './point-transaction.route';
import { pointTypeRoutes } from './point-type.route';

export const pointRoutes = ripple(
  {
    pointAccountRoutes,
    pointConversionRoutes,
    pointTransactionRoutes,
    pointTypeRoutes,
  },
  routes =>
    new Elysia({
      name: 'PointRoute',
      prefix: '/points',
      detail: {
        tags: ['Point'],
      },
    })
      .use(routes.pointTypeRoutes)
      .use(routes.pointAccountRoutes)
      .use(routes.pointConversionRoutes)
      .use(routes.pointTransactionRoutes),
);
