import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

export const dbEnv = createEnv({
  server: {
    /**
     * 数据库 URL
     */
    DATABASE_URL: v.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type DbEnv = typeof dbEnv;
