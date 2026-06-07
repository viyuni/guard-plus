import * as v from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';

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
    USER_PORT: v.optional(v.port(), 3800),

    /**
     * 用户前端地址，多个地址用英文逗号分隔
     */
    USER_ORIGINS: v.optional(
      v.envOrigins,
      'http://localhost:3000,http://guard-plus.localhost:3000',
    ),

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
