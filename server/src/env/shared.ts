import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

/**
 * 跨 App 共享的环境变量片段。
 *
 * 只在 App Boundary（apps 下各 config.ts）与脚本入口被读取,
 * 业务模块通过组合层令牌获取已归一化的配置。
 */
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

export type NodeEnv = SharedEnv['NODE_ENV'];
