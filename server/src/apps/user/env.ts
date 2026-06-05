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
     * 数据密钥
     */
    DATA_SECRET: v.string(),

    /**
     * JWT 密钥
     */
    JWT_SECRET: v.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
