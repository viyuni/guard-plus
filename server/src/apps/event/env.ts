import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { redisEnv } from '#env/redis';
import { sharedEnv } from '#env/shared';

export const eventEnv = createEnv({
  extends: [sharedEnv, redisEnv],
  server: {
    EVENT_SOURCE: v.optional(v.picklist(['bevent', 'laplace']), 'bevent'),
    BILI_ROOM: v.pipe(v.string(), v.toNumber()),
    DATA_SECRET: v.string(),
    VIYUNI_LOGIN_SYNC_URL: v.string(),
    VIYUNI_LOGIN_SYNC_PASSWORD: v.string(),
    LAPLACE_EVENT_BRIDGE_URL: v.optional(v.pipe(v.string(), v.url())),
    LAPLACE_EVENT_BRIDGE_TOKEN: v.optional(v.string()),
    LAPLACE_SERVER_KIND: v.optional(v.picklist(['eventBridge', 'eventFetcher']), 'eventFetcher'),
    LAPLACE_ACCEPT_MOCK: v.optional(v.picklist(['0', '1']), '0'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
