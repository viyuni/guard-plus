import { EventServiceCheckResultSchema } from '@shared/schema/event';
import Elysia from 'elysia';

import { appContext } from '#apps/admin/context';

export const event = new Elysia({
  name: 'EventRoute',
  prefix: '/event',
  detail: {
    tags: ['Event'],
  },
})
  .use(appContext)
  .post(
    '/check',
    async ({ eventServiceMonitor }) => {
      const probeId = await eventServiceMonitor.send();
      const healthy = await eventServiceMonitor.check(probeId);

      return { probeId, healthy };
    },
    {
      requiredSuperAdminAuth: true,
      response: EventServiceCheckResultSchema,
      detail: {
        description: '手动检查 Event 服务',
      },
    },
  );
