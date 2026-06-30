import { port, envOrigins } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { imageEnv } from '#env/image';
import { redisEnv } from '#env/redis';
import { sharedEnv } from '#env/shared';
import { smtpEnv } from '#env/smtp';

export const userEnv = createEnv({
  extends: [sharedEnv, imageEnv, redisEnv, smtpEnv],
  server: {
    /**
     * 用户服务端口
     */
    USER_PORT: v.optional(port(), 3800),

    /**
     * 用户端 API 公开 Origin
     */
    USER_API_ORIGIN: v.pipe(v.string(), v.url()),

    /**
     * 用户端 Web 公开 Origin
     */
    USER_WEB_ORIGINS: envOrigins,

    /**
     * B站直播间 ID
     */
    BILI_ROOM: v.pipe(v.string(), v.toNumber()),

    /**
     * 数据密钥
     */
    DATA_SECRET: v.string(),

    /**
     * 用户 JWT 密钥
     */
    USER_JWT_SECRET: v.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
