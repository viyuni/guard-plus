import { createEnv } from '@t3-oss/env-core';
import { token } from 'cyrenejs';
import * as v from 'valibot';

export const sharedEnv = createEnv({
  server: {
    /**
     * "development" | "production" | "test"
     */
    NODE_ENV: v.optional(v.picklist(['development', 'production', 'test']), 'development'),

    /**
     * 日志等级
     */
    LOG_LEVEL: v.optional(v.picklist(['debug', 'info', 'warn', 'error']), 'info'),

    /**
     * 数据密钥。多个服务共享同一份加密数据，必须配置相同的值。
     */
    DATA_SECRET: v.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type SharedEnv = typeof sharedEnv;

/**
 * 配置令牌。
 *
 * 模块用 `ripple({ dataSecret: DataSecret }, ...)` 声明自己需要的配置，
 * 具体值由 app 组合根在 `createContainer` 里绑定，模块不再直接读 env。
 */
export const DataSecret = token<string>('DataSecret');
