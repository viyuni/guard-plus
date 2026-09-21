import * as v from 'valibot';

const numberish = () => v.pipe(v.union([v.string(), v.number()]), v.transform(Number));

/** Redis 环境变量 Schema 片段。 */
export const redisEnv = {
  REDIS_URL: v.optional(v.string(), 'redis://localhost:6379'),
  REDIS_PASSWORD: v.optional(v.string()),
  REDIS_CONNECTION_TIMEOUT_MS: v.optional(numberish(), 5000),
  REDIS_IDLE_TIMEOUT_MS: v.optional(numberish(), 0),
  REDIS_MAX_RETRIES: v.optional(numberish(), 100),
};
