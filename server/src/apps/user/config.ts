import { envOrigins, port } from '@shared/schema';
import { createEnv } from '@t3-oss/env-core';
import { ripple } from 'cyrenex';
import * as v from 'valibot';

import { configEnv, type NodeEnv } from '#config';

/**
 * User App 专属的环境变量。
 *
 * 共享变量由 `#config` 统一解析成配置 ripple; SMTP 也在那里
 * 派生为 `SmtpConfig`, 未配置完整时 Mailer 选择降级实现。
 */
export const userEnv = createEnv({
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

/** 当前 App 对外暴露的 API Origin */
export const ApiOrigin = ripple('ApiOrigin', () => userEnv.USER_API_ORIGIN);

/** 当前 App 允许的 Web Origin */
export const WebOrigins = ripple('WebOrigins', () => userEnv.USER_WEB_ORIGINS);

export interface UserConfig {
  nodeEnv: NodeEnv;
  port: number;
}

/**
 * User App 的配置边界。
 *
 * 只有这里知道 `USER_` 前缀; 下游模块与适配器依赖的是配置 ripple。
 */
export const userConfig: UserConfig = {
  nodeEnv: configEnv.NODE_ENV,
  port: userEnv.USER_PORT,
};
