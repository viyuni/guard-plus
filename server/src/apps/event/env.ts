import { port } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { biliEnv } from '#env/bili';
import type { EventConfig } from '#env/config';
import { redisEnv } from '#env/redis';
import { sharedEnv } from '#env/shared';

export const eventEnv = createEnv({
  extends: [sharedEnv, biliEnv, redisEnv],
  server: {
    EVENT_PORT: v.optional(port(), 3700),
    VIYUNI_LOGIN_SYNC_URL: v.string(),
    VIYUNI_LOGIN_SYNC_PASSWORD: v.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

/** 事件进程只需要最小的一份配置。 */
export const eventAppConfig: EventConfig = {
  nodeEnv: eventEnv.NODE_ENV,
  dataSecret: eventEnv.DATA_SECRET,
  biliRoom: eventEnv.BILI_ROOM,
  registerCodeTtlSeconds: eventEnv.BILI_REGISTER_CODE_TTL_SECONDS,
};
