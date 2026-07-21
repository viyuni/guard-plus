import { port } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { redisEnv } from '#env/redis';
import { sharedEnv } from '#env/shared';

export const eventEnv = createEnv({
  extends: [sharedEnv, redisEnv],
  server: {
    EVENT_PORT: v.optional(port(), 3700),
    BILI_ROOM: v.pipe(v.string(), v.toNumber()),
    DATA_SECRET: v.string(),
    VIYUNI_LOGIN_SYNC_URL: v.string(),
    VIYUNI_LOGIN_SYNC_PASSWORD: v.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
