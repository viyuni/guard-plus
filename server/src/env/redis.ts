import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

import type { RedisConnectionOptions } from '#infrastructure/redis';

const numberish = () => v.pipe(v.union([v.string(), v.number()]), v.transform(Number));

export const redisEnv = createEnv({
  server: {
    /**
     * Redis URL
     */
    REDIS_URL: v.optional(v.string(), 'redis://localhost:6379'),

    /**
     * Redis 访问密码
     */
    REDIS_PASSWORD: v.optional(v.string()),

    /**
     * Redis 连接超时时间（毫秒）
     */
    REDIS_CONNECTION_TIMEOUT_MS: v.optional(numberish(), 5000),

    /**
     * Redis 空闲超时时间（毫秒），0 表示不主动断开
     */
    REDIS_IDLE_TIMEOUT_MS: v.optional(numberish(), 0),

    /**
     * Redis 自动重连最大次数
     */
    REDIS_MAX_RETRIES: v.optional(numberish(), 100),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type RedisEnv = typeof redisEnv;

/**
 * 把 Redis 环境变量映射成基础设施需要的连接配置。
 *
 * 映射与它读取的变量放在同一个 concern 里, App 只需要 `extends: [redisEnv]`
 * 再调用本函数, 不必各自重复一遍字段搬运。
 */
export function toRedisConnectionOptions(env: RedisEnv): RedisConnectionOptions {
  return {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
    connectionTimeoutMs: env.REDIS_CONNECTION_TIMEOUT_MS,
    idleTimeoutMs: env.REDIS_IDLE_TIMEOUT_MS,
    maxRetries: env.REDIS_MAX_RETRIES,
  };
}
