import path from 'node:path';

import { bilibiliUid, envOrigins, port } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { biliEnv } from '#config/bili';
import { databaseEnv } from '#config/database';
import { imageEnv } from '#config/image';
import { redisEnv } from '#config/redis';
import { type NodeEnv, sharedEnv } from '#config/shared';
import type { RedisConnectionOptions } from '#infrastructure/redis';
import { PasswordUtil } from '#shared';

const defaultImageSavePath = path.join(process.cwd(), 'public', 'images');
const superAdminPasswordSchema = v.pipe(v.string(), v.regex(/^(?=.*[A-Za-z])(?=.*\d).{8,32}$/));

export const adminEnv = createEnv({
  server: {
    ...sharedEnv,
    ...databaseEnv,
    ...biliEnv,
    ...imageEnv,
    ...redisEnv,

    /**
     * 管理员服务端口
     */
    ADMIN_PORT: v.optional(port(), 3600),

    /**
     * 管理端 API 公开 Origin
     */
    ADMIN_API_ORIGIN: v.pipe(v.string(), v.url()),

    /**
     * 管理端 Web 公开 Origin
     */
    ADMIN_WEB_ORIGINS: envOrigins,

    /**
     * 管理员 JWT 密钥
     */
    ADMIN_JWT_SECRET: v.string(),

    /**
     * 超级管理员默认 UID
     */
    SUPER_ADMIN_UID: v.optional(bilibiliUid, '0721'),

    /**
     * 超级管理员默认密码
     */
    SUPER_ADMIN_PASSWORD: v.optional(superAdminPasswordSchema, PasswordUtil.generate()),

    /**
     * 超级管理员默认用户名
     */
    SUPER_ADMIN_USERNAME: v.optional(v.string(), 'Admin'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export interface AdminConfig {
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
  superAdmin: {
    uid: string;
    username: string;
    password: string;
  };
}

/**
 * Admin App 的配置边界。
 *
 * 只有这里知道 `ADMIN_` 前缀；下游模块与适配器依赖的是组合层令牌。
 */
export const adminConfig: AdminConfig = {
  nodeEnv: adminEnv.NODE_ENV,
  logLevel: adminEnv.LOG_LEVEL,
  dataSecret: adminEnv.DATA_SECRET,
  databaseUrl: adminEnv.DATABASE_URL,
  redis: {
    url: adminEnv.REDIS_URL,
    password: adminEnv.REDIS_PASSWORD,
    connectionTimeoutMs: adminEnv.REDIS_CONNECTION_TIMEOUT_MS,
    idleTimeoutMs: adminEnv.REDIS_IDLE_TIMEOUT_MS,
    maxRetries: adminEnv.REDIS_MAX_RETRIES,
  },
  jwtSecret: adminEnv.ADMIN_JWT_SECRET,
  biliRoom: adminEnv.BILI_ROOM,
  registerCodeTtlSeconds: adminEnv.BILI_REGISTER_CODE_TTL_SECONDS,
  imageSavePath: adminEnv.IMAGE_SAVE_PATH ?? defaultImageSavePath,
  apiOrigin: adminEnv.ADMIN_API_ORIGIN,
  webOrigins: adminEnv.ADMIN_WEB_ORIGINS,
  port: adminEnv.ADMIN_PORT,
  superAdmin: {
    uid: adminEnv.SUPER_ADMIN_UID,
    username: adminEnv.SUPER_ADMIN_USERNAME,
    password: adminEnv.SUPER_ADMIN_PASSWORD,
  },
};
