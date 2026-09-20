import { port, bilibiliUid, envOrigins } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { biliEnv } from '#env/bili';
import type { AppConfig } from '#env/config';
import { imageEnv } from '#env/image';
import { redisEnv } from '#env/redis';
import { sharedEnv } from '#env/shared';
import { PasswordUtil } from '#utils';

const superAdminPasswordSchema = v.pipe(v.string(), v.regex(/^(?=.*[A-Za-z])(?=.*\d).{8,32}$/));

export const adminEnv = createEnv({
  extends: [sharedEnv, biliEnv, imageEnv, redisEnv],
  server: {
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

/**
 * admin env 到共享运行时配置的显式映射。
 *
 * 只有这份映射知道 `ADMIN_` 前缀；下游模块依赖的是通用令牌。
 */
export const adminAppConfig: AppConfig = {
  nodeEnv: adminEnv.NODE_ENV,
  dataSecret: adminEnv.DATA_SECRET,
  jwtSecret: adminEnv.ADMIN_JWT_SECRET,
  biliRoom: adminEnv.BILI_ROOM,
  registerCodeTtlSeconds: adminEnv.BILI_REGISTER_CODE_TTL_SECONDS,
  imageSavePath: adminEnv.IMAGE_SAVE_PATH,
  apiOrigin: adminEnv.ADMIN_API_ORIGIN,
  webOrigins: adminEnv.ADMIN_WEB_ORIGINS,
};
