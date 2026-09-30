import { bilibiliUid, envOrigins, port } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import { ripple } from 'cyrenex';
import * as v from 'valibot';

import { configEnv, type NodeEnv } from '#config';
import { PasswordUtil } from '#shared';

const superAdminPasswordSchema = v.pipe(v.string(), v.regex(/^(?=.*[A-Za-z])(?=.*\d).{8,32}$/));

/**
 * Admin App 专属的环境变量。
 *
 * 共享变量由 `#config` 统一解析成配置 ripple; 这里只保留
 * 只有 Admin 进程才会拿到的变量, 并按同样方式暴露成配置 ripple。
 */
export const adminEnv = createEnv({
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

/** 当前 App 对外暴露的 API Origin */
export const ApiOrigin = ripple('ApiOrigin', () => adminEnv.ADMIN_API_ORIGIN);

/** 当前 App 允许的 Web Origin */
export const WebOrigins = ripple('WebOrigins', () => adminEnv.ADMIN_WEB_ORIGINS);

export interface AdminConfig {
  nodeEnv: NodeEnv;
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
 * 只有这里知道 `ADMIN_` 前缀; 下游模块与适配器依赖的是配置 ripple。
 */
export const adminConfig: AdminConfig = {
  nodeEnv: configEnv.NODE_ENV,
  port: adminEnv.ADMIN_PORT,
  superAdmin: {
    uid: adminEnv.SUPER_ADMIN_UID,
    username: adminEnv.SUPER_ADMIN_USERNAME,
    password: adminEnv.SUPER_ADMIN_PASSWORD,
  },
};
