import Elysia from 'elysia';

import { appContext } from '../../context';
import { pointAccountRoute } from './point-account.route';
import { pointConversionRoute } from './point-conversion.route';
import { pointTransactionRoute } from './point-transaction.route';
import { pointTypeRoute } from './point-type.route';

export const point = new Elysia({
  name: 'PointRoute',
  prefix: '/points',
  detail: {
    tags: ['Point'],
  },
})
  .use(appContext)
  .use(pointTypeRoute)
  .use(pointAccountRoute)
  .use(pointConversionRoute)
  .use(pointTransactionRoute);
