import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

const numberish = () => v.pipe(v.union([v.string(), v.number()]), v.transform(Number));

export const biliEnv = createEnv({
  server: {
    /**
     * B站直播间 ID
     */
    BILI_ROOM: v.pipe(v.string(), v.toNumber()),

    /**
     * B 站注册码有效期（秒）
     */
    BILI_REGISTER_CODE_TTL_SECONDS: v.optional(numberish(), 300),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type BiliEnv = typeof biliEnv;
