import { port, bilibiliUid, envOrigins } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import { imageEnv } from '#env/image';
import { redisEnv } from '#env/redis';
import { sharedEnv } from '#env/shared';
import { PasswordUtil } from '#utils';

export const adminEnv = createEnv({
  extends: [sharedEnv, imageEnv, redisEnv],
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
     * 数据密钥
     */
    DATA_SECRET: v.string(),

    /**
     * 管理员 JWT 密钥
     */
    ADMIN_JWT_SECRET: v.string(),

    /**
     * B站直播间 ID
     */
    BILI_ROOM: v.pipe(v.string(), v.toNumber()),

    /**
     * 超级管理员默认 UID
     */
    SUPER_ADMIN_UID: v.optional(bilibiliUid, '0721'),

    /**
     * 超级管理员默认密码
     */
    SUPER_ADMIN_PASSWORD: v.optional(
      v.pipe(v.string(), v.regex(/^(?=.*[A-Za-z])(?=.*\d).{8,32}$/)),
      PasswordUtil.generate(),
    ),

    /**
     * 超级管理员默认用户名
     */
    SUPER_ADMIN_USERNAME: v.optional(v.string(), 'Admin'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
