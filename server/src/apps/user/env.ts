import { port, envOrigins } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { biliEnv } from '#env/bili';
import type { AppConfig } from '#env/config';
import { imageEnv } from '#env/image';
import { redisEnv } from '#env/redis';
import { sharedEnv } from '#env/shared';
import { smtpEnv, toSmtpConfig } from '#env/smtp';

export const userEnv = createEnv({
  extends: [sharedEnv, biliEnv, imageEnv, redisEnv, smtpEnv],
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
     * 用户 JWT 密钥
     */
    USER_JWT_SECRET: v.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

/**
 * user env 到共享运行时配置的显式映射。
 *
 * 只有这份映射知道 `USER_` 前缀；下游模块依赖的是通用令牌。
 */
export const userAppConfig: AppConfig = {
  nodeEnv: userEnv.NODE_ENV,
  dataSecret: userEnv.DATA_SECRET,
  jwtSecret: userEnv.USER_JWT_SECRET,
  biliRoom: userEnv.BILI_ROOM,
  registerCodeTtlSeconds: userEnv.BILI_REGISTER_CODE_TTL_SECONDS,
  imageSavePath: userEnv.IMAGE_SAVE_PATH,
  apiOrigin: userEnv.USER_API_ORIGIN,
  webOrigins: userEnv.USER_WEB_ORIGINS,
  smtp: toSmtpConfig(userEnv),
};
