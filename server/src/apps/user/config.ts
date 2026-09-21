import path from 'node:path';

import { envOrigins, port } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { biliEnv } from '#config/bili';
import { databaseEnv } from '#config/database';
import { imageEnv } from '#config/image';
import { redisEnv } from '#config/redis';
import { type NodeEnv, sharedEnv } from '#config/shared';
import { smtpEnv } from '#config/smtp';
import type { SmtpMailConfig } from '#infrastructure/mail';
import type { RedisConnectionOptions } from '#infrastructure/redis';

const defaultImageSavePath = path.join(process.cwd(), 'public', 'images');

export const userEnv = createEnv({
  server: {
    ...sharedEnv,
    ...databaseEnv,
    ...biliEnv,
    ...imageEnv,
    ...redisEnv,
    ...smtpEnv,

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
  redis: {
    url: userEnv.REDIS_URL,
    password: userEnv.REDIS_PASSWORD,
    connectionTimeoutMs: userEnv.REDIS_CONNECTION_TIMEOUT_MS,
    idleTimeoutMs: userEnv.REDIS_IDLE_TIMEOUT_MS,
    maxRetries: userEnv.REDIS_MAX_RETRIES,
  },
  jwtSecret: userEnv.USER_JWT_SECRET,
  biliRoom: userEnv.BILI_ROOM,
  registerCodeTtlSeconds: userEnv.BILI_REGISTER_CODE_TTL_SECONDS,
  imageSavePath: userEnv.IMAGE_SAVE_PATH ?? defaultImageSavePath,
  apiOrigin: userEnv.USER_API_ORIGIN,
  webOrigins: userEnv.USER_WEB_ORIGINS,
  port: userEnv.USER_PORT,
  mail:
    userEnv.SMTP_HOST && userEnv.SMTP_PORT && userEnv.SMTP_USER && userEnv.SMTP_PASS
      ? {
          host: userEnv.SMTP_HOST,
          port: userEnv.SMTP_PORT,
          user: userEnv.SMTP_USER,
          pass: userEnv.SMTP_PASS,
          from: userEnv.SMTP_FROM ?? userEnv.SMTP_USER,
          notifyEmails: userEnv.NOTIFY_EMAILS ?? [],
        }
      : undefined,
};
