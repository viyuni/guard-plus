import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

export const sharedEnv = createEnv({
  server: {
    /**
     * "development" | "production" | "test"
     */
    NODE_ENV: v.optional(v.picklist(['development', 'production', 'test']), 'development'),

    /**
     * 日志等级
     */
    LOG_LEVEL: v.optional(v.picklist(['debug', 'info', 'warn', 'error']), 'info'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type SharedEnv = typeof sharedEnv;
