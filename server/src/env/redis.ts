import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

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

    /**
     * B 站注册码有效期（秒）
     */
    BILI_REGISTER_CODE_TTL_SECONDS: v.optional(numberish(), 300),
  },
  runtimeEnv: {
    ...process.env,
    BILI_REGISTER_CODE_TTL_SECONDS: process.env.BILI_REGISTER_CODE_TTL_SECONDS,
  },
  emptyStringAsUndefined: true,
});

export type RedisEnv = typeof redisEnv;
