import { envOrigins, port } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { biliEnv } from '#env/bili';
import { dbEnv } from '#env/db';
import { imageEnv } from '#env/image';
import { redisEnv, toRedisConnectionOptions } from '#env/redis';
import { type NodeEnv, sharedEnv } from '#env/shared';
import { smtpEnv, toSmtpMailConfig } from '#env/smtp';
import type { SmtpMailConfig } from '#infrastructure/mail';
import type { RedisConnectionOptions } from '#infrastructure/redis';

export const userEnv = createEnv({
  extends: [sharedEnv, dbEnv, biliEnv, imageEnv, redisEnv, smtpEnv],
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

export interface UserConfig {
  nodeEnv: NodeEnv;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  dataSecret: string;
  databaseUrl: string;
  redis: RedisConnectionOptions;
  jwtSecret: string;
  biliRoom: number;
  registerCodeTtlSeconds: number;
  imageSavePath: string;
  apiOrigin: string;
  webOrigins: string[];
  port: number;
  /** SMTP 未完整配置时为 undefined，由组合根选择降级实现。 */
  mail: SmtpMailConfig | undefined;
}

/**
 * User App 的配置边界。
 *
 * 只有这里知道 `USER_` 前缀；下游模块与适配器依赖的是组合层令牌。
 */
export const userConfig: UserConfig = {
  nodeEnv: userEnv.NODE_ENV,
  logLevel: userEnv.LOG_LEVEL,
  dataSecret: userEnv.DATA_SECRET,
  databaseUrl: userEnv.DATABASE_URL,
  redis: toRedisConnectionOptions(userEnv),
  jwtSecret: userEnv.USER_JWT_SECRET,
  biliRoom: userEnv.BILI_ROOM,
  registerCodeTtlSeconds: userEnv.BILI_REGISTER_CODE_TTL_SECONDS,
  imageSavePath: userEnv.IMAGE_SAVE_PATH,
  apiOrigin: userEnv.USER_API_ORIGIN,
  webOrigins: userEnv.USER_WEB_ORIGINS,
  port: userEnv.USER_PORT,
  mail: toSmtpMailConfig(userEnv),
};
